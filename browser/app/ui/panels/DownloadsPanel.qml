import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: root
    width: 320
    height: 400
    color: "#252525"
    border.width: 1
    border.color: "#404040"
    radius: 8
    
    // Header
    Rectangle {
        id: header
        width: parent.width
        height: 44
        color: "transparent"
        border.width: 0
        border.color: "#404040"
        
        Text {
            anchors.left: parent.left
            anchors.leftMargin: 12
            anchors.verticalCenter: parent.verticalCenter
            text: "Downloads"
            color: "#e0e0e0"
            font.bold: true
            font.pixelSize: 14
        }
        
        Button {
            anchors.right: parent.right
            anchors.rightMargin: 8
            anchors.verticalCenter: parent.verticalCenter
            text: "Clear All"
            flat: true
            
            background: Rectangle {
                color: parent.down ? "#3a3a3a" : (parent.hovered ? "#333333" : "transparent")
                radius: 4
            }
            
            contentItem: Text {
                text: parent.text
                color: "#b0b0b0"
                font.pixelSize: 12
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
            
            onClicked: console.log("Clear downloads clicked")
        }
        
        // Separator
        Rectangle {
            width: parent.width
            height: 1
            color: "#404040"
            anchors.bottom: parent.bottom
        }
    }
    
    // List
    ListView {
        id: listView
        anchors.top: header.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        clip: true
        
        model: appBridge ? appBridge.recentDownloads : []
        
        delegate: Rectangle {
            width: listView.width
            height: 64
            color: "transparent"
            
            MouseArea {
                anchors.fill: parent
                hoverEnabled: true
                onEntered: parent.color = "#2a2a2a"
                onExited: parent.color = "transparent"
            }
            
            RowLayout {
                anchors.fill: parent
                anchors.margins: 12
                spacing: 12
                
                // Icon placeholder
                Rectangle {
                    width: 32
                    height: 32
                    color: "#333333"
                    radius: 4
                    Layout.alignment: Qt.AlignTop
                    
                    Text {
                        anchors.centerIn: parent
                        text: "📄"
                        color: "#e0e0e0"
                    }
                }
                
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 4
                    
                    Text {
                        text: modelData.filename
                        color: "#e0e0e0"
                        font.pixelSize: 13
                        elide: Text.ElideMiddle
                        Layout.fillWidth: true
                    }
                    
                    Text {
                        text: modelData.state === "completed" ? "Completed" : 
                              (modelData.state === "in_progress" ? 
                               Math.round((modelData.bytes_received / modelData.bytes_total) * 100) + "% - " + (modelData.bytes_received / 1024 / 1024).toFixed(1) + " MB" : 
                               modelData.state)
                        color: "#b0b0b0"
                        font.pixelSize: 11
                    }
                    
                    // Progress bar
                    Rectangle {
                        visible: modelData.state === "in_progress"
                        Layout.fillWidth: true
                        height: 3
                        color: "#404040"
                        radius: 1
                        
                        Rectangle {
                            width: parent.width * (modelData.bytes_received / Math.max(1, modelData.bytes_total))
                            height: parent.height
                            color: "#4a9eff"
                            radius: 1
                        }
                    }
                }
                
                // Actions
                Button {
                    text: "📂"
                    width: 28
                    height: 28
                    visible: modelData.state === "completed"
                    flat: true
                    
                    background: Rectangle {
                        color: parent.down ? "#3a3a3a" : (parent.hovered ? "#333333" : "transparent")
                        radius: 4
                    }
                    
                    onClicked: console.log("Open folder:", modelData.path)
                }
            }
            
            // Separator
            Rectangle {
                width: parent.width - 24
                height: 1
                color: "#333333"
                anchors.bottom: parent.bottom
                anchors.horizontalCenter: parent.horizontalCenter
                visible: index < listView.count - 1
            }
        }
        
        // Empty state
        Text {
            anchors.centerIn: parent
            text: "No recent downloads"
            color: "#666666"
            visible: listView.count === 0
        }
    }
}
