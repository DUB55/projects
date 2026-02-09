import QtQuick
import QtQuick.Window
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Shapes
import QtWebEngine
import "components"
import "assets"

Window {
    id: mainWindow
    width: 1400
    height: 900
    visible: false
    title: "Modern Browser"
    color: "#000000"
    flags: Qt.FramelessWindowHint | Qt.Window  // Remove window title bar

    // Icon Library
    IconPaths { id: icons }

    // --- Keyboard Shortcuts ---
    Shortcut { sequence: "Ctrl+T"; onActivated: createNewTab() }
    Shortcut { sequence: "Ctrl+W"; onActivated: closeTabAt(getCurrentTabIndex()) }
    Shortcut { sequence: "Ctrl+R"; onActivated: { var v = currentWebView(); if (v) v.reload() } }
    Shortcut { sequence: "F5"; onActivated: { var v = currentWebView(); if (v) v.reload() } }
    Shortcut { sequence: "Ctrl+L"; onActivated: { addressInput.forceActiveFocus(); addressInput.selectAll() } }
    Shortcut { sequence: "Alt+D"; onActivated: { addressInput.forceActiveFocus(); addressInput.selectAll() } }
    Shortcut { sequence: "Ctrl+Shift+I"; onActivated: { var v = currentWebView(); if (v) v.triggerWebAction(WebEngineView.InspectElement) } }
    Shortcut { sequence: "Ctrl+H"; onActivated: toggleHistory() }
    Shortcut { sequence: "Ctrl+Shift+B"; onActivated: toggleBookmarks() }
    Shortcut { sequence: "Ctrl+J"; onActivated: toggleDownloads() }
    Shortcut { sequence: "Ctrl+F"; onActivated: toggleFindBar() }
    Shortcut { sequence: "Ctrl+N"; onActivated: newWindow() }
    Shortcut { sequence: "Ctrl+Shift+N"; onActivated: newIncognitoWindow() }

    // Shared WebEngine Profile for persistent state
    WebEngineProfile {
        id: sharedProfile
        storageName: appBridge ? appBridge.currentProfileId : "default"
        persistentStoragePath: appBridge ? appBridge.persistentStoragePath : ""
        cachePath: appBridge ? appBridge.cachePath : ""
        offTheRecord: false
        httpCacheType: WebEngineProfile.DiskHttpCache
        persistentCookiesPolicy: WebEngineProfile.ForcePersistentCookies
    }

    // Component for handling new windows (popups/modals)
    Component {
        id: webWindowComponent
        Window {
            id: popupWindow
            property var request
            width: 800
            height: 600
            visible: false // Shown via .show() in onNewWindowRequested
            
            WebEngineView {
                id: popupView
                anchors.fill: parent
                profile: sharedProfile
                Component.onCompleted: {
                    if (popupWindow.request) {
                        popupWindow.request.openIn(popupView)
                    }
                }
            }
        }
    }

    // Internal tab management (fallback if appBridge not available)
    property var internalTabs: [{ "url": "https://duckduckgo.com", "title": "DuckDuckGo" }]
    property int internalCurrentTabIndex: 0

    // Tab Model for synchronization and persistence
    ListModel {
        id: tabsModel
        Component.onCompleted: syncTabs()
    }

    ListModel {
        id: groupsModel
    }

    function syncTabs() {
        var bridgeTabs = getTabs()
        if (!bridgeTabs) return
        
        // Sync Groups first
        if (appBridge) {
            var bridgeGroups = appBridge.tabGroups
            if (bridgeGroups) {
                groupsModel.clear()
                for (var g = 0; g < bridgeGroups.length; g++) {
                    groupsModel.append(bridgeGroups[g])
                }
            }
        }

        // If counts differ significantly or model is empty, rebuild
        if (tabsModel.count === 0 || Math.abs(tabsModel.count - bridgeTabs.length) > 1) {
            tabsModel.clear()
            for (var i = 0; i < bridgeTabs.length; i++) {
                tabsModel.append(bridgeTabs[i])
            }
        } else {
            // Incremental update to avoid recreating all views
            while (tabsModel.count < bridgeTabs.length) {
                tabsModel.append(bridgeTabs[bridgeTabs.length - 1])
            }
            while (tabsModel.count > bridgeTabs.length) {
                tabsModel.remove(tabsModel.count - 1)
            }
            
            for (var j = 0; j < bridgeTabs.length; j++) {
                if (tabsModel.get(j).url !== bridgeTabs[j].url)
                    tabsModel.setProperty(j, "url", bridgeTabs[j].url)
                if (tabsModel.get(j).title !== bridgeTabs[j].title)
                    tabsModel.setProperty(j, "title", bridgeTabs[j].title)
                if (tabsModel.get(j).groupId !== bridgeTabs[j].groupId)
                    tabsModel.setProperty(j, "groupId", bridgeTabs[j].groupId)
            }
        }
    }

    Connections {
        target: appBridge
        function onTabsChanged() { syncTabs() }
        function onGroupsChanged() { syncTabs() }
    }

    // Helper functions for tab management
    function getTabs() {
        return appBridge ? appBridge.tabs : internalTabs
    }

    function getCurrentTabIndex() {
        return appBridge ? appBridge.currentTabIndex : internalCurrentTabIndex
    }

    function createNewTab(url) {
        var targetUrl = url || "https://duckduckgo.com"
        if (appBridge) {
            appBridge.newTab(targetUrl)
        } else {
            internalTabs.push({ "url": targetUrl, "title": "New Tab" })
            internalCurrentTabIndex = internalTabs.length - 1
            internalTabsChanged()
            // webView.url = targetUrl
            // addressInput.text = targetUrl
        }
    }

    function activateTabAt(index) {
        if (appBridge) {
            appBridge.activateTab(index)
        } else {
            if (index >= 0 && index < internalTabs.length) {
                internalCurrentTabIndex = index
                webView.url = internalTabs[index].url
                addressInput.text = internalTabs[index].url
            }
        }
    }

    function closeTabAt(index) {
        if (appBridge) {
            appBridge.closeTab(index)
        } else {
            if (internalTabs.length > 1) {
                internalTabs.splice(index, 1)
                if (internalCurrentTabIndex >= internalTabs.length) {
                    internalCurrentTabIndex = internalTabs.length - 1
                }
                internalTabsChanged()
                webView.url = internalTabs[internalCurrentTabIndex].url
                addressInput.text = internalTabs[internalCurrentTabIndex].url
            }
        }
    }

    function updateCurrentTab(url, title) {
        if (appBridge) {
            appBridge.updateTab(appBridge.currentTabIndex, url, title)
        } else {
            if (internalCurrentTabIndex >= 0 && internalCurrentTabIndex < internalTabs.length) {
                internalTabs[internalCurrentTabIndex].url = url
                internalTabs[internalCurrentTabIndex].title = title
                internalTabsChanged()
            }
        }
    }

    // Liquid Glass Background Gradient
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#0f0c29" }
            GradientStop { position: 0.5; color: "#302b63" }
            GradientStop { position: 1.0; color: "#24243e" }
        }
        z: -100
    }

    // Global colors
    readonly property color darkBg: "transparent"
    readonly property color darkBg2: Qt.rgba(1, 1, 1, 0.05)
    readonly property color darkBg3: Qt.rgba(1, 1, 1, 0.1)
    readonly property color accentColor: "#4a9eff"
    readonly property color accentDark: "#2d7dd4"
    readonly property color textPrimary: "#ffffff"
    readonly property color textSecondary: "#b0b0b0"
    readonly property color borderColor: Qt.rgba(1, 1, 1, 0.1)
    readonly property color successColor: "#4ade80"

    // Toggle functions
    function toggleDownloads() {
        downloadsPanelLoader.active = !downloadsPanelLoader.active
    }
    
    function toggleBookmarks() {
        if (bookmarksManagerLoader.active) {
            bookmarksManagerLoader.active = false
        } else {
            closeAllOverlays()
            bookmarksManagerLoader.active = true
        }
    }
    
    function toggleHistory() {
        if (historyManagerLoader.active) {
            historyManagerLoader.active = false
        } else {
            closeAllOverlays()
            historyManagerLoader.active = true
        }
    }
    
    function togglePasswords() {
        if (passwordManagerLoader.active) {
            passwordManagerLoader.active = false
        } else {
            closeAllOverlays()
            passwordManagerLoader.active = true
        }
    }
    
    function toggleSettings() {
        if (settingsPageLoader.active) {
            settingsPageLoader.active = false
        } else {
            closeAllOverlays()
            settingsPageLoader.active = true
        }
    }
    
    function toggleFindBar() {
        if (findBarLoader.active) {
            findBarLoader.active = false
        } else {
            findBarLoader.active = true
        }
    }
    
    function closeAllOverlays() {
        bookmarksManagerLoader.active = false
        historyManagerLoader.active = false
        passwordManagerLoader.active = false
        settingsPageLoader.active = false
        downloadsPanelLoader.active = false
        findBarLoader.active = false
        mainMenu.close()
    }
    
    function openClearDataDialog() {
        clearDataDialogLoader.active = true
        if (clearDataDialogLoader.item) {
            clearDataDialogLoader.item.open()
        }
    }

    // --- Main Menu Functions ---
    function closeAllTabs() {
        if (appBridge) appBridge.closeAllTabs()
        mainMenu.close()
    }

    function clearHistory() {
        if (appBridge) appBridge.clearAllHistory()
        mainMenu.close()
    }

    function newIncognitoWindow() {
        // For now, just a placeholder or create a specific profile
        console.log("New Incognito Window requested")
        mainMenu.close()
    }

    function newWindow() {
        console.log("New Window requested")
        mainMenu.close()
    }
    
    // --- Settings Menu Functions ---
    function resetSettings() {
        if (appBridge) appBridge.resetSettings()
    }

    function addBookmark() {
        var view = currentWebView()
        if (appBridge && view) {
            appBridge.addBookmark(view.url.toString(), view.title)
            console.log("Bookmarked: " + view.url)
        }
    }

    function currentWebView() {
        return webViewRepeater.itemAt(getCurrentTabIndex())
    }

    // Main layout
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 0
        spacing: 0

        // ===== CUSTOM TITLE BAR (for window dragging since we removed native title bar) =====
        Rectangle {
            id: customTitleBar
            Layout.fillWidth: true
            height: 32
            color: Qt.rgba(0.02, 0.02, 0.05, 0.8)
            
            MouseArea {
                anchors.fill: parent
                property point clickPos: "0,0"
                onPressed: clickPos = Qt.point(mouse.x, mouse.y)
                onPositionChanged: {
                    var delta = Qt.point(mouse.x - clickPos.x, mouse.y - clickPos.y)
                    mainWindow.x += delta.x
                    mainWindow.y += delta.y
                }
            }
            
            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 12
                anchors.rightMargin: 8
                
                Text {
                    text: {
                        var view = currentWebView()
                        return (view && view.title.length > 0) ? view.title : "Modern Browser"
                    }
                    color: textSecondary
                    font.pixelSize: 12
                    elide: Text.ElideRight
                    Layout.fillWidth: true
                }
                
                // Window controls
                Button {
                    Layout.preferredWidth: 32
                    Layout.preferredHeight: 24
                    flat: true
                    text: "−"
                    font.pixelSize: 18
                    onClicked: mainWindow.showMinimized()
                    background: Rectangle { color: parent.hovered ? Qt.rgba(1,1,1,0.1) : "transparent"; radius: 4 }
                    contentItem: Text { text: parent.text; color: textPrimary; horizontalAlignment: Text.AlignHCenter; verticalAlignment: Text.AlignVCenter }
                }
                Button {
                    Layout.preferredWidth: 32
                    Layout.preferredHeight: 24
                    flat: true
                    text: "□"
                    font.pixelSize: 14
                    onClicked: mainWindow.visibility === Window.Maximized ? mainWindow.showNormal() : mainWindow.showMaximized()
                    background: Rectangle { color: parent.hovered ? Qt.rgba(1,1,1,0.1) : "transparent"; radius: 4 }
                    contentItem: Text { text: parent.text; color: textPrimary; horizontalAlignment: Text.AlignHCenter; verticalAlignment: Text.AlignVCenter }
                }
                Button {
                    Layout.preferredWidth: 32
                    Layout.preferredHeight: 24
                    flat: true
                    text: "✕"
                    font.pixelSize: 12
                    onClicked: Qt.quit()
                    background: Rectangle { color: parent.hovered ? "#e81123" : "transparent"; radius: 4 }
                    contentItem: Text { text: parent.text; color: parent.hovered ? "white" : textPrimary; horizontalAlignment: Text.AlignHCenter; verticalAlignment: Text.AlignVCenter }
                }
            }
        }

        // ===== HEADER / TOOLBAR =====
        Rectangle {
            id: header
            Layout.fillWidth: true
            height: 56
            color: Qt.rgba(0.05, 0.05, 0.1, 0.6)
            border.width: 1
            border.color: Qt.rgba(1, 1, 1, 0.1)
            
            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 12
                anchors.rightMargin: 12
                anchors.topMargin: 8
                anchors.bottomMargin: 8
                spacing: 8

                // Navigation buttons
                NavButton {
                    id: backBtn
                    Layout.preferredWidth: 36
                    Layout.preferredHeight: 36
                    iconPath: icons.back
                    iconSize: 18
                    enabled: currentWebView() ? currentWebView().canGoBack : false
                    onClicked: currentWebView().goBack()
                    ToolTip.visible: hovered
                    ToolTip.text: "Back"
                }

                NavButton {
                    id: forwardBtn
                    Layout.preferredWidth: 36
                    Layout.preferredHeight: 36
                    iconPath: icons.forward
                    iconSize: 18
                    enabled: currentWebView() ? currentWebView().canGoForward : false
                    onClicked: currentWebView().goForward()
                    ToolTip.visible: hovered
                    ToolTip.text: "Forward"
                }

                NavButton {
                    id: reloadBtn
                    Layout.preferredWidth: 36
                    Layout.preferredHeight: 36
                    iconPath: (currentWebView() && currentWebView().loading) ? icons.close : icons.refresh
                    iconSize: 18
                    onClicked: {
                        if (currentWebView()) {
                            if (currentWebView().loading) currentWebView().stop()
                            else currentWebView().reload()
                        }
                    }
                    ToolTip.visible: hovered
                    ToolTip.text: (currentWebView() && currentWebView().loading) ? "Stop" : "Reload"
                }

                NavButton {
                    id: homeBtn
                    Layout.preferredWidth: 36
                    Layout.preferredHeight: 36
                    iconPath: icons.home
                    iconSize: 18
                    onClicked: {
                        var homePage = appBridge ? appBridge.getSetting("homePage", "https://duckduckgo.com") : "https://duckduckgo.com"
                        var view = currentWebView()
                        if (view) view.url = homePage
                    }
                    ToolTip.visible: hovered
                    ToolTip.text: "Home"
                }

                // Address bar (Liquid Glass Pill)
                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 40
                    color: Qt.rgba(0, 0, 0, 0.3)
                    radius: 20
                    border.width: 1
                    border.color: addressInput.activeFocus ? accentColor : Qt.rgba(1, 1, 1, 0.1)
                    
                    Behavior on border.color { ColorAnimation { duration: 200 } }

                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 14
                        anchors.rightMargin: 14
                        spacing: 8
                        
                        // Security Status Indicator
                        RowLayout {
                            spacing: 6
                            visible: currentWebView() !== null
                            
                            Rectangle {
                                width: securityText.visible ? 70 : 28
                                height: 24
                                radius: 12
                                color: {
                                    var view = currentWebView()
                                    if (!view) return Qt.rgba(1, 1, 1, 0.1)
                                    var url = view.url.toString()
                                    if (url.startsWith("https://")) return Qt.rgba(0.29, 0.87, 0.5, 0.15)
                                    if (url.startsWith("http://")) return Qt.rgba(1, 0.42, 0.42, 0.15)
                                    return Qt.rgba(1, 1, 1, 0.1)
                                }
                                
                                RowLayout {
                                    anchors.centerIn: parent
                                    spacing: 4
                                    
                                    Item {
                                        width: 14
                                        height: 14
                                        Shape {
                                            anchors.fill: parent
                                            ShapePath {
                                                strokeWidth: 0
                                                fillColor: {
                                                    var view = currentWebView()
                                                    if (!view) return textSecondary
                                                    var url = view.url.toString()
                                                    if (url.startsWith("https://")) return successColor
                                                    if (url.startsWith("http://")) return "#ff6b6b"
                                                    return textSecondary
                                                }
                                                PathSvg { 
                                                    path: {
                                                        var view = currentWebView()
                                                        if (!view) return icons.globe
                                                        var url = view.url.toString()
                                                        if (url.startsWith("https://")) return icons.lock
                                                        if (url.startsWith("http://")) return icons.close
                                                        return icons.globe
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    Text {
                                        id: securityText
                                        text: {
                                            var view = currentWebView()
                                            if (!view) return ""
                                            var url = view.url.toString()
                                            if (url.startsWith("https://")) return "Secure"
                                            if (url.startsWith("http://")) return "Not Secure"
                                            return ""
                                        }
                                        color: {
                                            var view = currentWebView()
                                            if (!view) return textSecondary
                                            var url = view.url.toString()
                                            if (url.startsWith("https://")) return successColor
                                            if (url.startsWith("http://")) return "#ff6b6b"
                                            return textSecondary
                                        }
                                        font.pixelSize: 10
                                        font.bold: true
                                        visible: text !== ""
                                    }
                                }
                                
                                ToolTip.visible: securityMouseArea.hovered
                                ToolTip.text: {
                                    var view = currentWebView()
                                    if (!view) return "Unknown security status"
                                    var url = view.url.toString()
                                    if (url.startsWith("https://")) return "Connection is secure (HTTPS)"
                                    if (url.startsWith("http://")) return "Connection is not secure (HTTP)"
                                    return "Internal page"
                                }
                                
                                HoverHandler { id: securityMouseArea }
                            }
                        }

                        TextField {
                            id: addressInput
                            Layout.fillWidth: true
                            verticalAlignment: TextInput.AlignVCenter
                            placeholderText: "Search or enter address"
                            placeholderTextColor: "#666666"
                            text: "https://duckduckgo.com"
                            selectByMouse: true
                            font.pixelSize: 13
                            background: Item {}
                            color: textPrimary
                            selectionColor: accentColor

                            onAccepted: {
                                suggestionPopup.close()
                                var url = text.trim()
                                if (url.length === 0) return
                                if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("about:") && !url.startsWith("file://")) {
                                    // If it looks like a URL, add https://, otherwise search with DuckDuckGo
                                    if (url.indexOf(".") > 0 && url.indexOf(" ") < 0) {
                                        url = "https://" + url
                                    } else {
                                        url = "https://duckduckgo.com/?q=" + encodeURIComponent(url)
                                    }
                                }
                                var view = currentWebView()
                                if (view) view.url = url
                                focus = false
                            }
                            
                            onTextEdited: {
                                if (text.length > 1 && appBridge) {
                                    var suggestions = appBridge.getSuggestions(text)
                                    suggestionModel.clear()
                                    for (var i = 0; i < suggestions.length; i++) {
                                        suggestionModel.append(suggestions[i])
                                    }
                                    if (suggestionModel.count > 0) {
                                        suggestionPopup.open()
                                    } else {
                                        suggestionPopup.close()
                                    }
                                } else {
                                    suggestionPopup.close()
                                }
                            }
                        }

                        // Integrated Reload/Stop button in Address Bar
                        NavButton {
                            Layout.preferredWidth: 28
                            Layout.preferredHeight: 28
                            iconPath: (currentWebView() && currentWebView().loading) ? icons.close : icons.refresh
                            iconSize: 14
                            onClicked: {
                                if (currentWebView()) {
                                    if (currentWebView().loading) currentWebView().stop()
                                    else currentWebView().reload()
                                }
                            }
                            ToolTip.visible: hovered
                            ToolTip.text: (currentWebView() && currentWebView().loading) ? "Stop" : "Reload"
                        }

                        NavButton {
                            Layout.preferredWidth: 28
                            Layout.preferredHeight: 28
                            iconPath: icons.star
                            iconSize: 14
                            onClicked: addBookmark()
                            ToolTip.visible: hovered
                            ToolTip.text: "Bookmark this page"
                        }
                    }

                    // Loading Progress Bar
                    Rectangle {
                        anchors.bottom: parent.bottom
                        anchors.left: parent.left
                        anchors.right: parent.right
                        anchors.leftMargin: 20
                        anchors.rightMargin: 20
                        height: 2
                        color: accentColor
                        visible: currentWebView() && currentWebView().loading
                        width: (currentWebView() ? currentWebView().loadProgress / 100.0 : 0) * (parent.width - 40)
                        
                        Behavior on width { NumberAnimation { duration: 200 } }
                    }
                }
                    
                    // Suggestion Popup
                    Popup {
                        id: suggestionPopup
                        x: 0
                        y: 45
                        width: parent.width
                        padding: 1
                        
                        background: Rectangle {
                            color: Qt.rgba(0.1, 0.1, 0.1, 0.95)
                            border.width: 1
                            border.color: Qt.rgba(1, 1, 1, 0.1)
                            radius: 12
                        }
                        
                        ListView {
                            id: suggestionListView
                            width: parent.width
                            height: Math.min(300, contentHeight)
                            model: ListModel { id: suggestionModel }
                            clip: true
                            
                            delegate: ItemDelegate {
                                width: suggestionListView.width
                                height: 36
                                highlighted: ListView.isCurrentItem
                                
                                background: Rectangle {
                                    color: parent.highlighted ? accentColor : "transparent"
                                    opacity: parent.highlighted ? 0.2 : 1.0
                                }
                                
                                RowLayout {
                                    anchors.fill: parent
                                    anchors.leftMargin: 12
                                    anchors.rightMargin: 12
                                    spacing: 8
                                    
                                    Text {
                                        text: model.icon || ""
                                        color: textSecondary
                                        font.pixelSize: 14
                                    }
                                    
                                    Text {
                                        text: model.title || ""
                                        color: textPrimary
                                        font.pixelSize: 13
                                        elide: Text.ElideRight
                                        Layout.fillWidth: true
                                    }
                                    
                                    Text {
                                        text: model.type || ""
                                        color: textSecondary
                                        font.pixelSize: 10
                                    }
                                }
                                
                                onClicked: {
                                    addressInput.text = model.url
                                    addressInput.accepted()
                                    suggestionPopup.close()
                                }
                        }
                    }
                }

                // Separator
                Rectangle { width: 1; height: 28; color: Qt.rgba(1, 1, 1, 0.15) }

                // Action Buttons
                NavButton { Layout.preferredWidth: 36; Layout.preferredHeight: 36; iconPath: icons.history; onClicked: toggleHistory(); ToolTip.visible: hovered; ToolTip.text: "History" }
                NavButton { Layout.preferredWidth: 36; Layout.preferredHeight: 36; iconPath: icons.starOutline; onClicked: toggleBookmarks(); ToolTip.visible: hovered; ToolTip.text: "Bookmarks" }
                NavButton { Layout.preferredWidth: 36; Layout.preferredHeight: 36; iconPath: icons.download; onClicked: toggleDownloads(); ToolTip.visible: hovered; ToolTip.text: "Downloads" }
                NavButton { Layout.preferredWidth: 36; Layout.preferredHeight: 36; iconPath: icons.key; onClicked: togglePasswords(); ToolTip.visible: hovered; ToolTip.text: "Passwords" }
                NavButton { Layout.preferredWidth: 36; Layout.preferredHeight: 36; iconPath: icons.settings; onClicked: toggleSettings(); ToolTip.visible: hovered; ToolTip.text: "Settings" }

                // Separator
                Rectangle { width: 1; height: 28; color: Qt.rgba(1, 1, 1, 0.15) }

                // Profile Selector
                ComboBox {
                    id: profileSelector
                    Layout.preferredWidth: 120
                    Layout.preferredHeight: 32
                    model: appBridge ? appBridge.allProfiles : []
                    textRole: "name"
                    currentIndex: 0
                    visible: appBridge != null
                    
                    background: Rectangle {
                        color: Qt.rgba(0.05, 0.05, 0.1, 0.4)
                        radius: 16
                        border.width: 1
                        border.color: Qt.rgba(1, 1, 1, 0.1)
                    }

                    contentItem: Text {
                        color: textPrimary
                        text: profileSelector.displayText
                        leftPadding: 12
                        verticalAlignment: Text.AlignVCenter
                        elide: Text.ElideRight
                        font.pixelSize: 12
                    }

                    delegate: ItemDelegate {
                        width: profileSelector.width
                        height: 32
                        highlighted: profileSelector.highlightedIndex === index
                        background: Rectangle { color: highlighted ? accentColor : "#252525" }
                        contentItem: Text {
                            color: highlighted ? "white" : "#e0e0e0"
                            text: modelData.name
                            leftPadding: 12
                            verticalAlignment: Text.AlignVCenter
                        }
                    }

                    onActivated: (index) => {
                        if (index >= 0 && appBridge) {
                            var profile = appBridge.allProfiles[index]
                            appBridge.selectProfile(profile.id)
                        }
                    }
                }

                NavButton { 
                    Layout.preferredWidth: 36; 
                    Layout.preferredHeight: 36; 
                    iconPath: icons.menu; 
                    onClicked: mainMenu.open(); 
                    ToolTip.visible: hovered; 
                    ToolTip.text: "Menu" 
                }
            }
        }

        // ===== MAIN MENU POPUP =====
        Popup {
            id: mainMenu
            x: mainWindow.width - width - 12
            y: header.y + header.height + 4
            width: 280
            padding: 8
            dim: false
            
            background: Rectangle {
                color: Qt.rgba(0.12, 0.12, 0.15, 0.98)
                border.width: 1
                border.color: Qt.rgba(1, 1, 1, 0.1)
                radius: 12
                
                layer.enabled: true
                // layer.effect: DropShadow { radius: 16; samples: 24; color: "#aa000000"; verticalOffset: 8 }
            }

            contentItem: ColumnLayout {
                spacing: 2
                
                // --- General Actions ---
                MenuItemCustom { menuIcon: icons.add; menuText: "Nieuwe Tab"; menuShortcut: "Ctrl+T"; onClicked: { createNewTab(); mainMenu.close() } }
                MenuItemCustom { menuIcon: icons.add; menuText: "Nieuw Venster"; menuShortcut: "Ctrl+N"; onClicked: newWindow() }
                MenuItemCustom { menuIcon: icons.globe; menuText: "Nieuw Incognito Venster"; menuShortcut: "Ctrl+Shift+N"; onClicked: newIncognitoWindow() }
                MenuSeparatorCustom {}
                MenuItemCustom { menuIcon: icons.history; menuText: "Geschiedenis"; menuShortcut: "Ctrl+H"; onClicked: toggleHistory() }
                MenuItemCustom { menuIcon: icons.download; menuText: "Downloads"; menuShortcut: "Ctrl+J"; onClicked: toggleDownloads() }
                MenuItemCustom { menuIcon: icons.star; menuText: "Bladwijzers"; menuShortcut: "Ctrl+Shift+B"; onClicked: toggleBookmarks() }
                MenuItemCustom { menuIcon: icons.key; menuText: "Wachtwoorden"; onClicked: togglePasswords() }
                MenuSeparatorCustom {}
                MenuItemCustom { menuIcon: icons.close; menuText: "Alle Tabs Sluiten"; onClicked: closeAllTabs() }
                MenuItemCustom { menuIcon: icons.history; menuText: "Geschiedenis Wissen"; onClicked: clearHistory() }
                MenuItemCustom { menuIcon: icons.settings; menuText: "Tabgroepen"; onClicked: console.log("Tabgroepen clicked") }
                MenuSeparatorCustom {}
                MenuItemCustom { menuIcon: icons.settings; menuText: "Instellingen"; onClicked: toggleSettings() }
                MenuItemCustom { menuIcon: icons.close; menuText: "Afsluiten"; onClicked: Qt.quit() }
            }
        }

    // --- Web Page Context Menu ---
    Popup {
        id: webContextMenu
        property var request: null
        
        width: 220
        padding: 8
        background: Rectangle {
            color: "#1e1e22"
            radius: 8
            border.width: 1
            border.color: Qt.rgba(1, 1, 1, 0.1)
        }
        
        ColumnLayout {
            width: parent.width
            spacing: 2
            
            MenuItemCustom {
                menuText: "Back"
                menuIcon: icons.back
                enabled: currentWebView() ? currentWebView().canGoBack : false
                onClicked: { currentWebView().goBack(); webContextMenu.close() }
            }
            MenuItemCustom {
                menuText: "Forward"
                menuIcon: icons.forward
                enabled: currentWebView() ? currentWebView().canGoForward : false
                onClicked: { currentWebView().goForward(); webContextMenu.close() }
            }
            MenuItemCustom {
                menuText: "Reload"
                menuIcon: icons.refresh
                onClicked: { currentWebView().reload(); webContextMenu.close() }
            }
            
            MenuSeparatorCustom {}

            MenuItemCustom {
                menuText: "Open Link in New Tab"
                visible: webContextMenu.request && webContextMenu.request.linkUrl.toString() !== ""
                onClicked: {
                    createNewTab(webContextMenu.request.linkUrl.toString())
                    webContextMenu.close()
                }
            }

            MenuItemCustom {
                menuText: "Copy Link Address"
                visible: webContextMenu.request && webContextMenu.request.linkUrl.toString() !== ""
                onClicked: {
                    if (appBridge) appBridge.setClipboardText(webContextMenu.request.linkUrl.toString())
                    webContextMenu.close()
                }
            }

            MenuSeparatorCustom { visible: webContextMenu.request && webContextMenu.request.linkUrl.toString() !== "" }
            
            MenuItemCustom {
                menuText: "Copy Page URL"
                onClicked: {
                    if (appBridge && currentWebView()) appBridge.setClipboardText(currentWebView().url.toString())
                    webContextMenu.close()
                }
            }
            
            MenuItemCustom {
                menuText: "Copy Page Title"
                onClicked: {
                    if (appBridge && currentWebView()) appBridge.setClipboardText(currentWebView().title)
                    webContextMenu.close()
                }
            }

            MenuSeparatorCustom {}
            
            MenuItemCustom {
                menuText: "Save Page As..."
                onClicked: { /* Implementation for saving page */ webContextMenu.close() }
            }
            MenuItemCustom {
                menuText: "Print..."
                onClicked: { /* Implementation for printing */ webContextMenu.close() }
            }
            
            MenuSeparatorCustom {}
            
            MenuItemCustom {
                menuText: "View Page Source"
                onClicked: { 
                    if (currentWebView()) {
                        var sourceUrl = "view-source:" + currentWebView().url
                        createNewTab(sourceUrl)
                    }
                    webContextMenu.close() 
                }
            }
            MenuItemCustom {
                menuText: "Inspect Element"
                onClicked: {
                    if (currentWebView()) {
                        currentWebView().triggerWebAction(WebEngineView.InspectElement)
                    }
                    webContextMenu.close()
                }
            }
        }
    }

    // --- Tab Context Menu ---
    Popup {
        id: tabContextMenu
        property int tabId: -1
        property int tabIndex: -1
        
        width: 200
        padding: 8
        background: Rectangle {
            color: "#1e1e22"
            radius: 8
            border.width: 1
            border.color: Qt.rgba(1, 1, 1, 0.1)
        }
        
        ColumnLayout {
            width: parent.width
            spacing: 2
            
            MenuItemCustom {
                menuText: "Close Tab"
                onClicked: {
                    closeTabAt(tabContextMenu.tabIndex)
                    tabContextMenu.close()
                }
            }
            
            MenuItemCustom {
                menuText: "Duplicate Tab"
                onClicked: {
                    if (appBridge) {
                        var tab = tabsModel.get(tabContextMenu.tabIndex)
                        appBridge.newTab(tab.url)
                    }
                    tabContextMenu.close()
                }
            }
            
            MenuSeparatorCustom {}
            
            MenuItemCustom {
                menuText: "Add to New Group"
                onClicked: {
                    createGroupPopup.targetTabId = tabContextMenu.tabId
                    createGroupPopup.open()
                    tabContextMenu.close()
                }
            }
            
            // Existing Groups
            Repeater {
                model: groupsModel
                delegate: MenuItemCustom {
                    menuText: "Add to: " + model.title
                    onClicked: {
                        if (appBridge) {
                            appBridge.addTabToGroup(tabContextMenu.tabId, model.id)
                        }
                        tabContextMenu.close()
                    }
                    Rectangle {
                        anchors.left: parent.left
                        anchors.verticalCenter: parent.verticalCenter
                        anchors.leftMargin: 4
                        width: 3
                        height: 12
                        color: model.color
                    }
                }
            }
            
            MenuItemCustom {
                menuText: "Remove from Group"
                visible: {
                    if (tabContextMenu.tabIndex === -1) return false
                    var tab = tabsModel.get(tabContextMenu.tabIndex)
                    return !!(tab && tab.groupId !== undefined && tab.groupId !== "")
                }
                onClicked: {
                    if (appBridge) {
                        appBridge.removeTabFromGroup(tabContextMenu.tabId)
                    }
                    tabContextMenu.close()
                }
            }
            
            MenuSeparatorCustom {}
        }
    }

    // --- Create Group Popup ---
    Popup {
        id: createGroupPopup
        property int targetTabId: -1
        property string selectedColor: "#4a9eff"
        
        anchors.centerIn: parent
        width: 300
        modal: true
        focus: true
        padding: 20
        
        background: Rectangle {
            color: "#1e1e22"
            radius: 12
            border.width: 1
            border.color: accentColor
        }
        
        ColumnLayout {
            anchors.fill: parent
            spacing: 16
            
            Text {
                text: "Create Tab Group"
                color: textPrimary
                font.bold: true
                font.pixelSize: 16
            }
            
            TextField {
                id: groupTitleInput
                Layout.fillWidth: true
                placeholderText: "Group Title"
                color: textPrimary
                background: Rectangle { color: "#333333"; radius: 4 }
            }
            
            RowLayout {
                Layout.fillWidth: true
                spacing: 8
                Text { text: "Color:"; color: textSecondary }
                
                Repeater {
                    model: ["#4a9eff", "#ff6b6b", "#51cf66", "#fcc419", "#cc5de8"]
                    delegate: Rectangle {
                        width: 24
                        height: 24
                        radius: 12
                        color: modelData
                        border.width: createGroupPopup.selectedColor === modelData ? 2 : 0
                        border.color: "white"
                        
                        MouseArea {
                            anchors.fill: parent
                            onClicked: createGroupPopup.selectedColor = modelData
                        }
                    }
                }
            }
            
            RowLayout {
                Layout.alignment: Qt.AlignRight
                spacing: 12
                
                Button {
                    text: "Cancel"
                    onClicked: createGroupPopup.close()
                }
                
                Button {
                    text: "Create"
                    onClicked: {
                        if (appBridge && groupTitleInput.text !== "") {
                            var groupId = appBridge.createGroup(groupTitleInput.text, createGroupPopup.selectedColor)
                            if (groupId && createGroupPopup.targetTabId !== -1) {
                                appBridge.addTabToGroup(createGroupPopup.targetTabId, groupId)
                            }
                        }
                        createGroupPopup.close()
                    }
                }
            }
        }
    }

        // --- Custom Menu Components ---
        component MenuItemCustom : ItemDelegate {
            property string menuIcon: ""
            property string menuText: ""
            property string menuShortcut: ""
            
            Layout.fillWidth: true
            height: 36
            padding: 8
            
            background: Rectangle {
                color: parent.hovered ? Qt.rgba(1, 1, 1, 0.08) : "transparent"
                radius: 6
            }
            
            contentItem: RowLayout {
                spacing: 12
                Item {
                    width: 16; height: 16
                    Shape {
                        anchors.fill: parent
                        ShapePath { strokeWidth: 0; fillColor: textSecondary; PathSvg { path: menuIcon } }
                    }
                }
                Text {
                    text: menuText
                    color: textPrimary
                    font.pixelSize: 13
                    Layout.fillWidth: true
                }
                Text {
                    text: menuShortcut
                    color: textSecondary
                    font.pixelSize: 11
                }
            }
        }
        
        component MenuSeparatorCustom : Rectangle {
            Layout.fillWidth: true
            height: 1
            color: Qt.rgba(1, 1, 1, 0.08)
            Layout.topMargin: 4
            Layout.bottomMargin: 4
        }

        // ===== TAB BAR =====
        Rectangle {
            Layout.fillWidth: true
            height: 36
            color: Qt.rgba(0.03, 0.03, 0.08, 0.6)
            
            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 8
                spacing: 2
                
                Repeater {
                    id: tabRepeater
                    model: tabsModel
                    
                    delegate: Rectangle {
                        id: tabDelegate
                        property bool isActive: index === getCurrentTabIndex()
                        property bool isHovered: tabMouseArea.containsMouse
                        
                        Layout.preferredWidth: Math.min(200, Math.max(120, (parent.width - 50) / Math.max(1, tabRepeater.count)))
                        Layout.fillHeight: true
                        radius: 8
                        
                        color: isActive ? Qt.rgba(1, 1, 1, 0.12) : (isHovered ? Qt.rgba(1, 1, 1, 0.06) : "transparent")
                        
                        // Group indicator (top bar)
                        Rectangle {
                            anchors.top: parent.top
                            anchors.left: parent.left
                            anchors.right: parent.right
                            height: 2
                            color: {
                                if (!model.groupId) return "transparent"
                                for (var i = 0; i < groupsModel.count; i++) {
                                    if (groupsModel.get(i).id === model.groupId)
                                        return groupsModel.get(i).color
                                }
                                return "transparent"
                            }
                            visible: model.groupId !== undefined && model.groupId !== ""
                        }
                        
                        MouseArea {
                            id: tabMouseArea
                            anchors.fill: parent
                            hoverEnabled: true
                            acceptedButtons: Qt.LeftButton | Qt.RightButton
                            onClicked: (mouse) => {
                                if (mouse.button === Qt.RightButton) {
                                    tabContextMenu.tabId = model.id
                                    tabContextMenu.tabIndex = index
                                    tabContextMenu.open()
                                } else {
                                    activateTabAt(index)
                                }
                            }
                        }

                        Rectangle {
                            anchors.bottom: parent.bottom
                            width: parent.width
                            height: 2
                            radius: 1
                            color: accentColor
                            visible: parent.isActive
                        }
                        
                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: 10
                            anchors.rightMargin: 6
                            spacing: 6
                            z: 10 // Ensure buttons are clickable above MouseArea
                            
                            // Group Title if present
                            Text {
                                text: {
                                    if (!model.groupId) return ""
                                    for (var i = 0; i < groupsModel.count; i++) {
                                        if (groupsModel.get(i).id === model.groupId)
                                            return groupsModel.get(i).title
                                    }
                                    return ""
                                }
                                color: {
                                    if (!model.groupId) return "transparent"
                                    for (var i = 0; i < groupsModel.count; i++) {
                                        if (groupsModel.get(i).id === model.groupId)
                                            return groupsModel.get(i).color
                                    }
                                    return "transparent"
                                }
                                font.pixelSize: 10
                                font.bold: true
                                visible: text !== ""
                                Layout.maximumWidth: 40
                                elide: Text.ElideRight
                            }

                            Item {
                                width: 14
                                height: 14
                                Shape {
                                    anchors.fill: parent
                                    ShapePath {
                                        strokeWidth: 0
                                        fillColor: tabDelegate.isActive ? textPrimary : textSecondary
                                        PathSvg { path: icons.globe }
                                    }
                                }
                            }
                            
                            Text {
                                text: (model.title && model.title !== "") ? model.title : "New Tab"
                                color: tabDelegate.isActive ? textPrimary : textSecondary
                                font.pixelSize: 12
                                elide: Text.ElideRight
                                Layout.fillWidth: true
                            }
                            
                            Button {
                                id: closeTabBtn
                                visible: tabDelegate.isActive || tabDelegate.isHovered
                                Layout.preferredWidth: 18
                                Layout.preferredHeight: 18
                                z: 20 // Ensure button is on top
                                background: Rectangle { color: closeTabBtn.hovered ? Qt.rgba(1, 0, 0, 0.3) : "transparent"; radius: 9 }
                                contentItem: Item {
                                    Shape {
                                        anchors.centerIn: parent
                                        width: 8
                                        height: 8
                                        ShapePath { strokeWidth: 0; fillColor: closeTabBtn.hovered ? "#ff6b6b" : textSecondary; PathSvg { path: icons.close } }
                                    }
                                }
                                onClicked: {
                                    closeTabAt(index)
                                }
                            }
                        }
                    }
                }
                
                // New Tab Button
                Button {
                    id: newTabBtn
                    Layout.preferredWidth: 28
                    Layout.preferredHeight: 28
                    background: Rectangle { color: newTabBtn.hovered ? Qt.rgba(1, 1, 1, 0.12) : "transparent"; radius: 14 }
                    contentItem: Item { 
                        Shape { 
                            anchors.centerIn: parent
                            width: 12
                            height: 12
                            ShapePath { strokeWidth: 0; fillColor: newTabBtn.hovered ? textPrimary : textSecondary; PathSvg { path: icons.add } } 
                        } 
                    }
                    onClicked: createNewTab()
                    ToolTip.visible: hovered
                    ToolTip.text: "New Tab"
                }

                Item { Layout.fillWidth: true }
            }
        }

        // ===== MAIN CONTENT =====
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "transparent"

            StackLayout {
                id: webViewStack
                anchors.fill: parent
                currentIndex: getCurrentTabIndex()
                
                onCurrentIndexChanged: {
                    fadeAnimation.restart()
                }
                
                NumberAnimation {
                    id: fadeAnimation
                    target: webViewStack
                    property: "opacity"
                    from: 0.5
                    to: 1.0
                    duration: 200
                    easing.type: Easing.OutQuad
                }

                Repeater {
                    id: webViewRepeater
                    model: tabsModel
                    
                    delegate: WebEngineView {
                        id: tabWebView
                        profile: sharedProfile
                        // Initialize with current URL from model
                        url: model.url
                        
                        settings {
                            javascriptEnabled: true
                            javascriptCanAccessClipboard: true
                            // javascriptCanPaste: true
                            // developerExtrasEnabled: true
                            // pluginsEnabled: true
                            allowWindowActivationFromJavaScript: true
                            localContentCanAccessRemoteUrls: true
                            localStorageEnabled: true
                        }
                        
                        onNewWindowRequested: (request) => {
                            var win = webWindowComponent.createObject(mainWindow, { "request": request })
                            win.show()
                        }

                        onContextMenuRequested: (request) => {
                            request.accepted = true
                            webContextMenu.request = request
                            webContextMenu.x = request.position.x
                            webContextMenu.y = request.position.y
                            webContextMenu.open()
                        }

                        onLoadingChanged: (loadRequest) => {
                            if (loadRequest.status === WebEngineView.LoadSucceededStatus) {
                                if (index === getCurrentTabIndex()) {
                                    addressInput.text = url
                                }
                                updateCurrentTab(url.toString(), title)
                                if (appBridge) {
                                    appBridge.recordSiteVisit(url.toString())
                                }
                            }
                        }

                        onUrlChanged: {
                            if (index === getCurrentTabIndex()) {
                                addressInput.text = url
                            }
                        }

                        onTitleChanged: {
                            updateCurrentTab(url.toString(), title)
                        }
                    }
                }
            }
        }
        // Status bar removed as requested
    }

    // ===== OVERLAYS (Outside Layout) =====
    
    Loader {
        id: downloadsPanelLoader
        active: false
        source: "panels/DownloadsPanel.qml"
        anchors.right: parent.right
        anchors.rightMargin: 12
        anchors.top: parent.top
        anchors.topMargin: 96
        z: 100
    }
    
    Loader {
        id: bookmarksManagerLoader
        active: false
        source: "pages/BookmarksManager.qml"
        anchors.fill: parent
        anchors.topMargin: 88
        z: 90
        visible: active
    }

    Loader {
        id: historyManagerLoader
        active: false
        source: "pages/HistoryManager.qml"
        anchors.fill: parent
        anchors.topMargin: 88
        z: 90
        visible: active
    }
    
    Loader {
        id: clearDataDialogLoader
        active: false
        source: "dialogs/ClearBrowsingDataDialog.qml"
        onLoaded: item.open()
    }
    
    Loader {
        id: passwordManagerLoader
        active: false
        source: "pages/PasswordManager.qml"
        anchors.fill: parent
        anchors.topMargin: 88
        z: 90
        visible: active
    }
    
    Loader {
        id: findBarLoader
        active: false
        source: "components/FindBar.qml"
        anchors.right: parent.right
        anchors.rightMargin: 20
        anchors.top: parent.top
        anchors.topMargin: 98
        z: 110
        onLoaded: {
            if (item) {
                item.webView = currentWebView()
                item.open()
            }
        }
    }
    
    Loader {
        id: settingsPageLoader
        active: false
        source: "pages/SettingsPage.qml"
        anchors.fill: parent
        anchors.topMargin: 88
        z: 90
        visible: active
    }

    Component.onCompleted: {
        console.log("========================================")
        console.log("Browser Application UI Loaded")
        console.log("Homepage: DuckDuckGo (no captcha issues)")
        console.log("Tab Count: " + getTabs().length)
        console.log("========================================")
    }
}
