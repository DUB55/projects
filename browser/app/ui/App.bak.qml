import QtQuick
import QtQuick.Window
import QtQuick.Controls
import QtQuick.Layouts
import QtWebEngine
import "components"
import "assets"

Window {
    id: mainWindow
    width: 1400
    height: 900
    visible: true
    title: "Modern Browser"
    color: "#000000" // Base color behind the gradient

    // Icon Library
    IconPaths { id: icons }

    // Liquid Glass Background Gradient
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#0f0c29" }
            GradientStop { position: 0.5; color: "#302b63" }
            GradientStop { position: 1.0; color: "#24243e" }
        }
        z: -100 // Behind everything
    }

    // Global colors - Glass theme overrides
    readonly property color darkBg: "transparent" // Content area transparent to show gradient
    readonly property color darkBg2: Qt.rgba(1, 1, 1, 0.05) // Glass panels
    readonly property color darkBg3: Qt.rgba(1, 1, 1, 0.1) // Hover state
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
    
    function closeAllOverlays() {
        bookmarksManagerLoader.active = false
        historyManagerLoader.active = false
        passwordManagerLoader.active = false
        settingsPageLoader.active = false
    }
    
    function openClearDataDialog() {
        clearDataDialogLoader.active = true
        if (clearDataDialogLoader.item) {
            clearDataDialogLoader.item.open()
        }
    }

    // Main layout
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 0
        spacing: 0

        // ===== HEADER / TOOLBAR =====
        Rectangle {
            id: header
            Layout.fillWidth: true
            height: 60
            color: Qt.rgba(0.05, 0.05, 0.1, 0.6) // Semi-transparent glass
            border.width: 1
            border.color: Qt.rgba(1, 1, 1, 0.1)
            
            // Blur effect simulation (optional, depends on Qt version/availability)
            // layer.enabled: true
            
            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 16
                anchors.rightMargin: 16
                anchors.topMargin: 8
                anchors.bottomMargin: 8
                spacing: 12

                // Navigation buttons
                NavButton {
                    id: backBtn
                    iconPath: icons.back
                    iconSize: 20
                    enabled: webView.canGoBack
                    onClicked: webView.goBack()
                }

                NavButton {
                    id: forwardBtn
                    iconPath: icons.forward
                    iconSize: 20
                    enabled: webView.canGoForward
                    onClicked: webView.goForward()
                }

                NavButton {
                    id: refreshBtn
                    iconPath: webView.loading ? icons.close : icons.refresh
                    iconSize: 18
                    onClicked: webView.loading ? webView.stop() : webView.reload()
                }

                NavButton {
                    id: homeBtn
                    iconPath: icons.home
                    iconSize: 20
                    onClicked: webView.url = appBridge ? appBridge.getSetting("homePage", "about:home") : "about:home"
                }
                // Separator
                Rectangle {
                    width: 1
                    height: 32
                    color: Qt.rgba(1, 1, 1, 0.2)
                }

                // Address bar (Liquid Glass Pill)
                Rectangle {
                    Layout.fillWidth: true
                    height: 40
                    color: Qt.rgba(0, 0, 0, 0.3) // Darker glass for input
                    radius: 20 // Pill shape
                    border.width: addressInput.activeFocus ? 1 : 1
                    border.color: addressInput.activeFocus ? accentColor : Qt.rgba(1, 1, 1, 0.1)
                    
                    Behavior on border.color { ColorAnimation { duration: 200 } }

                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 16
                        anchors.rightMargin: 8
                        spacing: 8
                        
                        // Secure Lock Icon
                        Item {
                            width: 16
                            height: 16
                            visible: webView.url.toString().startsWith("https")
                            
                            Shape {
                                anchors.fill: parent
                                ShapePath {
                                    strokeWidth: 0
                                    fillColor: successColor
                                    PathSvg { path: icons.lock }
                                }
                            }
                        }

                        TextField {
                            id: addressInput
                            Layout.fillWidth: true
                            verticalAlignment: TextInput.AlignVCenter
                            placeholderText: "Search or enter address"
                            placeholderTextColor: "#666666"
                            text: "about:home"
                            selectByMouse: true
                            font.pixelSize: 14

                        background: Rectangle {
                            color: "transparent"
                        }

                        color: textPrimary
                        selectionColor: accentColor

                        onAccepted: {
                            suggestionPopup.close()
                            var url = text.trim()
                            if (url.length === 0) return
                            if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("about:") && !url.startsWith("file://")) {
                                url = "https://" + url
                            }
                            webView.url = url
                            focus = false
                        }
                        
                        onTextEdited: {
                            if (text.length > 1) {
                                var suggestions = appBridge ? appBridge.getSuggestions(text) : []
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

                    NavButton {
                        id: bookmarkBtn
                        iconPath: icons.star
                        iconSize: 18
                        size: 32
                        hoverOpacity: 0.2
                        iconColor: hovered ? "#fbbf24" : "#888888" // Gold on hover
                        
                        onClicked: {
                            console.log("Bookmark clicked")
                        }
                    }
                }
                    
                    // Suggestion Popup
                    Popup {
                        id: suggestionPopup
                        x: 0
                        y: 45
                        width: parent.width
                        height: Math.min(300, suggestionListView.contentHeight)
                        padding: 1
                        
                        background: Rectangle {
                            color: Qt.rgba(0.1, 0.1, 0.1, 0.95)
                            border.width: 1
                            border.color: Qt.rgba(1, 1, 1, 0.1)
                            radius: 12
                        }
                        
                        ListView {
                            id: suggestionListView
                            anchors.fill: parent
                            model: ListModel { id: suggestionModel }
                            clip: true
                            
                            delegate: ItemDelegate {
                                width: suggestionListView.width
                                height: 36
                                
                                background: Rectangle {
                                    color: parent.highlighted ? accentColor : "transparent"
                                    opacity: parent.highlighted ? 0.2 : 1.0
                                }
                                
                                RowLayout {
                                    anchors.fill: parent
                                    anchors.leftMargin: 12
                                    anchors.rightMargin: 12
                                    spacing: 8
                                    
                                    // Icon placeholder (could use Shape here too)
                                    Text {
                                        text: model.icon
                                        color: textSecondary
                                        font.pixelSize: 14
                                    }
                                    
                                    Text {
                                        text: model.title
                                        color: textPrimary
                                        font.pixelSize: 13
                                        elide: Text.ElideRight
                                        Layout.fillWidth: true
                                    }
                                    
                                    Text {
                                        text: model.type
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
                }

                // Action Buttons to the right
                NavButton {
                    id: historyBtn
                    iconPath: icons.history
                    iconSize: 20
                    ToolTip.visible: hovered
                    ToolTip.text: "History"
                    onClicked: toggleHistory()
                }

                NavButton {
                    id: bmBtn
                    iconPath: icons.starOutline
                    iconSize: 20
                    ToolTip.visible: hovered
                    ToolTip.text: "Bookmarks"
                    onClicked: toggleBookmarks()
                }

                NavButton {
                    id: dlBtn
                    iconPath: icons.download
                    iconSize: 20
                    ToolTip.visible: hovered
                    ToolTip.text: "Downloads"
                    onClicked: toggleDownloads()
                }

                NavButton {
                    id: pwBtn
                    iconPath: icons.key
                    iconSize: 20
                    ToolTip.visible: hovered
                    ToolTip.text: "Passwords"
                    onClicked: togglePasswords()
                }

                NavButton {
                    id: settingsBtn
                    iconPath: icons.settings
                    iconSize: 20
                    ToolTip.visible: hovered
                    ToolTip.text: "Settings"
                    onClicked: toggleSettings()
                }

                // Profile selector (Glass Style)
                ComboBox {
                    id: profileSelector
                    Layout.preferredWidth: 150
                    Layout.preferredHeight: 32
                    model: appBridge ? appBridge.allProfiles : []
                    textRole: "name"
                    currentIndex: 0
                    
                    background: Rectangle {
                        color: Qt.rgba(0.05, 0.05, 0.1, 0.4)
                        radius: 16
                        border.width: 1
                        border.color: Qt.rgba(1, 1, 1, 0.1)
                    }

                    contentItem: Text {
                        color: textPrimary
                        text: profileSelector.displayText
                        leftPadding: 16
                        verticalAlignment: Text.AlignVCenter
                        elide: Text.ElideRight
                    }

                    delegate: ItemDelegate {
                        width: profileSelector.width
                        height: 36
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
                        if (index >= 0) {
                            var profile = appBridge.profiles[index]
                            appBridge.selectProfile(profile.id)
                        }
                    }
                }

                // Menu button
                NavButton {
                    id: menuBtn
                    iconPath: icons.menu
                    iconSize: 20
                    onClicked: console.log("Menu clicked")
                }
            }
        }

        // ===== TAB BAR =====
        Rectangle {
            Layout.fillWidth: true
            height: 38
            color: "#1e1e1e"
            
            RowLayout {
                anchors.fill: parent
                spacing: 1
                
                Repeater {
                    model: appBridge ? appBridge.tabs : []
                    
                    Rectangle {
                        property bool isActive: index === (appBridge ? appBridge.currentTabIndex : -1)
                        property bool isHovered: tabMouseArea.containsMouse
                        
                        Layout.preferredWidth: 200
                        Layout.maximumWidth: 240
                        Layout.minimumWidth: 120
                        Layout.fillHeight: true
                        
                        color: isActive ? "#2b2b2b" : (isHovered ? "#222222" : "transparent")
                        
                        // Top line for active tab
                        Rectangle {
                            anchors.top: parent.top
                            width: parent.width
                            height: 2
                            color: accentColor
                            visible: parent.isActive
                        }
                        
                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: 10
                            anchors.rightMargin: 4
                            spacing: 8
                            
                            // Favicon
                            Item {
                                width: 14
                                height: 14
                                Shape {
                                    anchors.fill: parent
                                    ShapePath {
                                        strokeWidth: 0
                                        fillColor: textSecondary
                                        PathSvg { path: icons.globe }
                                    }
                                }
                            }
                            
                            // Title
                            Text {
                                text: (modelData.title && modelData.title !== "") ? modelData.title : "New Tab"
                                color: parent.parent.isActive ? textPrimary : textSecondary
                                font.pixelSize: 12
                                elide: Text.ElideRight
                                Layout.fillWidth: true
                            }
                            
                            // Close Button
                            Button {
                                id: closeTabBtn
                                visible: parent.parent.isActive || parent.parent.isHovered
                                Layout.preferredWidth: 20
                                Layout.preferredHeight: 20
                                
                                background: Rectangle {
                                    color: closeTabBtn.hovered ? Qt.rgba(1, 0, 0, 0.2) : "transparent"
                                    radius: 10
                                }
                                contentItem: Item {
                                    Shape {
                                        anchors.centerIn: parent
                                        width: 10
                                        height: 10
                                        ShapePath {
                                            strokeWidth: 0
                                            fillColor: closeTabBtn.hovered ? "#ff6b6b" : textSecondary
                                            PathSvg { path: icons.close }
                                        }
                                    }
                                }
                                onClicked: appBridge.closeTab(index)
                            }
                        }
                        
                        MouseArea {
                            id: tabMouseArea
                            anchors.fill: parent
                            hoverEnabled: true
                            z: -1 // Ensure button gets clicks
                            onClicked: appBridge.activateTab(index)
                        }
                    }
                }
                
                // New Tab Button
                Button {
                    id: newTabBtn
                    Layout.preferredWidth: 32
                    Layout.preferredHeight: 32
                    
                    background: Rectangle {
                        color: newTabBtn.hovered ? Qt.rgba(1, 1, 1, 0.1) : "transparent"
                        radius: 16
                    }
                    contentItem: Item {
                        Shape {
                            anchors.centerIn: parent
                            width: 14
                            height: 14
                            ShapePath {
                                strokeWidth: 0
                                fillColor: newTabBtn.hovered ? textPrimary : textSecondary
                                PathSvg { path: icons.add }
                            }
                        }
                    }
                    onClicked: appBridge.newTab()
                }
                        


                Item { Layout.fillWidth: true } // Spacer
            }
        }
                


        // ===== MAIN CONTENT AREA =====
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: darkBg

            // WebEngineView for rendering web pages
            WebEngineView {
                id: webView
                anchors.fill: parent
                url: "about:home" // Initial default

                // Sync URL when tab changes
                Connections {
                    target: appBridge
                    function onCurrentTabChanged() {
                        var idx = appBridge.currentTabIndex
                        if (idx >= 0 && idx < appBridge.tabs.length) {
                             var tabUrl = appBridge.tabs[idx].url
                             if (webView.url.toString() !== tabUrl) {
                                 webView.url = tabUrl
                             }
                             // Update address bar text manually as well
                             addressInput.text = tabUrl
                        }
                    }
                }

                onLoadingChanged: (loadRequest) => {
                    if (loadRequest.status === WebEngineView.LoadStartedStatus) {
                        console.log("Page load started")
                    }
                    else if (loadRequest.status === WebEngineView.LoadSucceededStatus) {
                        console.log("Page load succeeded:", url)
                        addressInput.text = url
                        // Update backend
                        if (appBridge) {
                            appBridge.updateTab(appBridge.currentTabIndex, url.toString(), title)
                            appBridge.recordSiteVisit(url.toString())
                        }
                    }
                    else if (loadRequest.status === WebEngineView.LoadFailedStatus) {
                        console.log("Page load failed:", url)
                        // Update backend even on failure (to save URL)
                         if (appBridge) {
                            appBridge.updateTab(appBridge.currentTabIndex, url.toString(), title)
                        }
                    }
                }

                onTitleChanged: {
                    mainWindow.title = title.length > 0 ? (title + " - Browser") : "Browser"
                    if (appBridge) {
                        appBridge.updateTab(appBridge.currentTabIndex, url.toString(), title)
                    }
                }
                
                onUrlChanged: {
                    // addressInput.text = url // Moved to load succeeded to avoid flicker
                }
            }

            // Loading indicator
            Rectangle {
                id: loadingOverlay
                anchors.fill: parent
                color: "transparent"
                visible: webView.loading

                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 16

                    Text {
                        text: "Loading..."
                        color: textPrimary
                        font.pixelSize: 16
                        Layout.alignment: Qt.AlignHCenter
                    }

                    ProgressBar {
                        from: 0
                        to: 100
                        value: webView.loadProgress
                        Layout.preferredWidth: 200

                        background: Rectangle {
                            color: darkBg3
                            radius: 4
                        }

                        contentItem: Rectangle {
                            color: accentColor
                            radius: 2
                            implicitHeight: 4
                        }
                    }
                }
            }
        }

        // ===== STATUS BAR =====
        Rectangle {
            Layout.fillWidth: true
            height: 28
            color: darkBg2
            border.width: 1
            border.color: borderColor

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 8
                anchors.rightMargin: 8
                spacing: 4

                Text {
                    id: statusText
                    text: webView.url
                    color: textSecondary
                    font.pixelSize: 11
                    Layout.fillWidth: true
                    elide: Text.ElideRight
                }

                Text {
                    text: webView.loading ? "Loading..." : "Ready"
                    color: webView.loading ? accentColor : successColor
                    font.pixelSize: 11
                    font.bold: true
                }
            }
        }

        /*
        // ===== OVERLAYS =====
        
        // Downloads Panel
        Loader {
            id: downloadsPanelLoader
            active: false
            source: "panels/DownloadsPanel.qml"
            
            anchors.right: parent.right
            anchors.rightMargin: 12
            anchors.top: header.bottom
            anchors.topMargin: 8
            z: 100
            
            Behavior on opacity { NumberAnimation { duration: 150 } }
        }
        
        // Bookmarks Manager Page (Overlay)
        Loader {
            id: bookmarksManagerLoader
            active: false
            source: "pages/BookmarksManager.qml"
            anchors.fill: parent
            anchors.topMargin: 52 // Below header
            z: 90
            visible: active
        }

        // History Manager Page (Overlay)
        Loader {
            id: historyManagerLoader
            active: false
            source: "pages/HistoryManager.qml"
            anchors.fill: parent
            anchors.topMargin: 52 // Below header
            z: 90
            visible: active
        }
        
        // Dialogs
        Loader {
            id: clearDataDialogLoader
            active: false
            source: "dialogs/ClearBrowsingDataDialog.qml"
            onLoaded: item.open()
        }
        
        // Password Manager Page (Overlay)
        Loader {
            id: passwordManagerLoader
            active: false
            source: "pages/PasswordManager.qml"
            anchors.fill: parent
            anchors.topMargin: 52 // Below header
            z: 90
            visible: active
        }
        
        // Settings Page (Overlay)
        Loader {
            id: settingsPageLoader
            active: false
            source: "pages/SettingsPage.qml"
            anchors.fill: parent
            anchors.topMargin: 52 // Below header
            z: 90
            visible: active
        }
        */
        
    } // End ColumnLayout
    
    // Toggle functions


    // Component initialization
    Component.onCompleted: {
        console.log("App.qml: Dark mode UI loaded successfully")
        if (appBridge) {
            console.log("AppBridge is available")
        }
    }
}
