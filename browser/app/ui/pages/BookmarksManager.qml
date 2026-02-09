import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: root
    visible: false // Managed by parent
    
    color: "#1e1e1e"
    anchors.fill: parent
    
    // Header
    Rectangle {
        id: header
        width: parent.width
        height: 50
        color: "#252525"
        border.width: 0
        border.color: "#333333"
        border.dock: Border.Bottom

        RowLayout {
            anchors.fill: parent
            anchors.margins: 12
            spacing: 16
            
            Text {
                text: "Bookmarks"
                color: "#e0e0e0"
                font.bold: true
                font.pixelSize: 18
            }
            
            Item { Layout.fillWidth: true }
            
            TextField {
                placeholderText: "Search bookmarks..."
                Layout.preferredWidth: 250
                selectByMouse: true
                color: "#e0e0e0"
                background: Rectangle {
                    color: "#333333"
                    radius: 4
                }
            }
        }
    }
    
    // Content
    SplitView {
        anchors.top: header.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        
        // Left Pane: Folders
        Rectangle {
            SplitView.preferredWidth: 200
            SplitView.minimumWidth: 150
            color: "#222222"
            
            ListView {
                anchors.fill: parent
                anchors.margins: 8
                model: appBridge ? appBridge.bookmarksTree.folders : []
                spacing: 4
                
                header: Item {
                    width: parent.width
                    height: 32
                    Text {
                        anchors.verticalCenter: parent.verticalCenter
                        text: "Folders"
                        color: "#909090"
                        font.pixelSize: 12
                        font.bold: true
                    }
                }
                
                delegate: Rectangle {
                    width: parent.width
                    height: 32
                    color: "transparent"
                    radius: 4
                    
                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 8
                        spacing: 8
                        
                        Text { text: "📁"; color: "#e0e0e0" }
                        Text { 
                            text: modelData.name 
                            color: "#e0e0e0"
                            Layout.fillWidth: true
                            elide: Text.ElideRight
                        }
                    }
                    
                    MouseArea {
                        anchors.fill: parent
                        hoverEnabled: true
                        onEntered: parent.color = "#333333"
                        onExited: parent.color = "transparent"
                        onClicked: console.log("Select folder:", modelData.id)
                    }
                }
            }
        }
        
        // Right Pane: Bookmarks List
        Rectangle {
            SplitView.fillWidth: true
            color: "#1e1e1e"
            
            ListView {
                anchors.fill: parent
                anchors.margins: 16
                model: appBridge ? appBridge.bookmarksTree.bookmarks : []
                spacing: 8
                clip: true
                
                delegate: Rectangle {
                    width: parent.width
                    height: 40
                    color: "transparent"
                    radius: 4
                    
                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 8
                        anchors.rightMargin: 8
                        spacing: 12
                        
                        // Icon
                        Rectangle {
                            width: 24
                            height: 24
                            color: "#333333"
                            radius: 4
                            Text { 
                                anchors.centerIn: parent
                                text: "★"
                                color: "#ffd700"
                            }
                        }
                        
                        ColumnLayout {
                            Layout.fillWidth: true
                            spacing: 0
                            
                            Text { 
                                text: modelData.title
                                color: "#e0e0e0"
                                font.pixelSize: 13
                                elide: Text.ElideRight
                                Layout.fillWidth: true
                            }
                            Text { 
                                text: modelData.url
                                color: "#909090"
                                font.pixelSize: 11
                                elide: Text.ElideRight
                                Layout.fillWidth: true
                            }
                        }
                        
                        Button {
                            text: "×"
                            flat: true
                            onClicked: {
                                if (appBridge) appBridge.removeBookmark(modelData.id)
                            }
                        }
                    }
                    
                    MouseArea {
                        anchors.fill: parent
                        hoverEnabled: true
                        z: -1
                        onEntered: parent.color = "#2a2a2a"
                        onExited: parent.color = "transparent"
                        onClicked: console.log("Open bookmark:", modelData.url)
                    }
                }
                
                // Empty state
                Text {
                    anchors.centerIn: parent
                    text: "No bookmarks in this folder"
                    color: "#666666"
                    visible: parent.count === 0
                }
            }
        }
    }
}
