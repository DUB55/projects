import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: root
    visible: false
    color: "#1e1e1e"
    anchors.fill: parent
    
    // Header
    Rectangle {
        id: header
        width: parent.width
        height: 50
        color: "#252525"
        border.width: 0 // border.dock not supported in standard Rectangle
        
        // Bottom border manually
        Rectangle {
            anchors.bottom: parent.bottom
            width: parent.width
            height: 1
            color: "#333333"
        }

        RowLayout {
            anchors.fill: parent
            anchors.margins: 12
            spacing: 16
            
            Text {
                text: "History"
                color: "#e0e0e0"
                font.bold: true
                font.pixelSize: 18
            }
            
            Item { Layout.fillWidth: true }
            
            TextField {
                id: searchField
                placeholderText: "Search history..."
                Layout.preferredWidth: 300
                selectByMouse: true
                color: "#e0e0e0"
                background: Rectangle {
                    color: "#333333"
                    radius: 4
                }
                
                onAccepted: {
                    if (appBridge) {
                        // In a real app, this would trigger a search on the model
                        // For now, we assume the model updates or we call a method
                        console.log("Searching history for:", text)
                    }
                }
            }
            
            Button {
                text: "Clear Browsing Data"
                flat: true
                
                background: Rectangle {
                    color: parent.down ? "#3a3a3a" : (parent.hovered ? "#333333" : "transparent")
                    radius: 4
                    border.width: 1
                    border.color: "#404040"
                }
                
                contentItem: Text {
                    text: parent.text
                    color: "#e0e0e0"
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                
                onClicked: console.log("Open Clear Data Dialog")
            }
        }
    }
    
    // History List
    ListView {
        id: historyList
        anchors.top: header.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.margins: 20
        clip: true
        spacing: 0
        
        // Mock model for now if bridge not ready with direct history list properties
        // The bridge has searchHistory method but maybe no direct "recent history" property exposed yet
        // We will assume 'recentHistory' exists or use a dummy model for structure
        model: 20 
        
        delegate: Rectangle {
            width: parent.width
            height: 48
            color: "transparent"
            
            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 12
                anchors.rightMargin: 12
                spacing: 16
                
                Text {
                    text: "10:30 AM" // Mock time
                    color: "#808080"
                    font.pixelSize: 12
                    Layout.preferredWidth: 60
                }
                
                Rectangle {
                    width: 24
                    height: 24
                    color: "#333333"
                    radius: 4
                    Text { 
                        anchors.centerIn: parent
                        text: "H"
                        color: "#cccccc"
                    }
                }
                
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 2
                    
                    Text {
                        text: "Page Title " + index
                        color: "#e0e0e0"
                        font.pixelSize: 13
                        elide: Text.ElideRight
                        Layout.fillWidth: true
                    }
                    
                    Text {
                        text: "https://example.com/page/" + index
                        color: "#808080"
                        font.pixelSize: 11
                        elide: Text.ElideRight
                        Layout.fillWidth: true
                    }
                }
                
                Button {
                    text: "×"
                    width: 30
                    height: 30
                    flat: true
                    onClicked: console.log("Delete history item")
                }
            }
            
            // Hover effect
            MouseArea {
                anchors.fill: parent
                hoverEnabled: true
                z: -1
                onEntered: parent.color = "#2a2a2a"
                onExited: parent.color = "transparent"
                onClicked: console.log("Navigate to history item")
            }
            
            // Separator
            Rectangle {
                anchors.bottom: parent.bottom
                width: parent.width
                height: 1
                color: "#2a2a2a"
            }
        }
    }
}
