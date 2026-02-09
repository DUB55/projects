import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: findBar
    height: 48
    width: 400
    color: "#1e1e22"
    radius: 12
    border.width: 1
    border.color: Qt.rgba(1, 1, 1, 0.1)
    
    layer.enabled: true
    // layer.effect: DropShadow { radius: 16; samples: 24; color: "#aa000000"; verticalOffset: 8 }
    
    // Signals
    signal findNext()
    signal findPrevious()
    signal closeFind()
    signal searchTermChanged(string term)
    
    // Properties
    property var webView: null
    property int matchCount: 0
    property int currentMatch: 0
    property string searchTerm: ""
    property bool caseSensitive: false

    function open() {
        searchInput.forceActiveFocus()
        if (searchTerm !== "") {
            performSearch()
        }
    }

    function performSearch() {
        if (webView && searchTerm !== "") {
            var options = WebEngineView.FindBackward | (caseSensitive ? WebEngineView.FindCaseSensitively : 0)
            webView.findText(searchTerm, options, function(result) {
                matchCount = result.numberOfMatches
                currentMatch = result.activeMatch
            })
        }
    }

    onSearchTermChanged: performSearch()
    onFindNext: {
        if (webView && searchTerm !== "") {
            var options = caseSensitive ? WebEngineView.FindCaseSensitively : 0
            webView.findText(searchTerm, options, function(result) {
                matchCount = result.numberOfMatches
                currentMatch = result.activeMatch
            })
        }
    }
    onFindPrevious: {
        if (webView && searchTerm !== "") {
            var options = WebEngineView.FindBackward | (caseSensitive ? WebEngineView.FindCaseSensitively : 0)
            webView.findText(searchTerm, options, function(result) {
                matchCount = result.numberOfMatches
                currentMatch = result.activeMatch
            })
        }
    }
    onCloseFind: {
        if (webView) webView.findText("")
        findBarLoader.active = false
    }
    
    RowLayout {
        anchors.fill: parent
        anchors.margins: 8
        spacing: 8
        
        // Label
        Text {
            text: "Find:"
            color: "#666666"
            font.pixelSize: 12
        }
        
        // Search input
        Rectangle {
            Layout.preferredWidth: 200
            height: 32
            radius: 4
            color: "#ffffff"
            border.color: "#d0d0d0"
            
            TextInput {
                id: searchInput
                anchors.fill: parent
                anchors.margins: 6
                verticalAlignment: Text.AlignVCenter
                focus: true
                
                onTextChanged: {
                    searchTerm = text
                    searchTermChanged(text)
                }
                
                onAccepted: findNext()
            }
        }
        
        // Match counter
        Text {
            text: matchCount > 0 ? currentMatch + "/" + matchCount : "No matches"
            color: matchCount > 0 ? "#333333" : "#999999"
            font.pixelSize: 12
            Layout.preferredWidth: 80
        }
        
        // Case sensitive checkbox
        RowLayout {
            spacing: 4
            
            CheckBox {
                id: caseSensitiveCheck
                checked: caseSensitive
                onCheckedChanged: caseSensitive = checked
            }
            
            Text {
                text: "Match case"
                font.pixelSize: 12
                color: "#666666"
            }
        }
        
        // Previous button
        Button {
            text: "↑"
            width: 32
            height: 32
            enabled: matchCount > 0
            
            onClicked: findPrevious()
        }
        
        // Next button
        Button {
            text: "↓"
            width: 32
            height: 32
            enabled: matchCount > 0
            
            onClicked: findNext()
        }
        
        // Close button
        Button {
            text: "✕"
            width: 32
            height: 32
            
            background: Rectangle {
                radius: 4
                color: parent.hovered ? "#ffebee" : "transparent"
            }
            
            onClicked: closeFind()
        }
        
        Item {
            Layout.fillWidth: true
        }
    }
    
    Keys.onEscapePressed: closeFind()
}
