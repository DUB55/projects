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
                text: "Passwords"
                color: "#e0e0e0"
                font.bold: true
                font.pixelSize: 18
            }
            
            Item { Layout.fillWidth: true }
            
            TextField {
                placeholderText: "Search passwords..."
                Layout.preferredWidth: 300
                selectByMouse: true
                color: "#e0e0e0"
                background: Rectangle {
                    color: "#333333"
                    radius: 4
                }
            }
            
            Button {
                text: "Add Password"
                
                background: Rectangle {
                    color: parent.down ? "#2d7dd4" : "#4a9eff"
                    radius: 4
                }
                
                contentItem: Text {
                    text: parent.text
                    color: "#ffffff"
                    font.bold: true
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                
                onClicked: console.log("Open Add Password Dialog")
            }
        }
    }
    
    // Passwords List
    ListView {
        id: passwordList
        anchors.top: header.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.margins: 20
        clip: true
        spacing: 1
        
        model: appBridge ? appBridge.savedPasswords : []
        
        header: Rectangle {
            width: parent.width
            height: 40
            color: "transparent"
            
            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 12
                anchors.rightMargin: 12
                
                Text { text: "Site"; color: "#909090"; font.bold: true; Layout.preferredWidth: 200 }
                Text { text: "Username"; color: "#909090"; font.bold: true; Layout.preferredWidth: 200 }
                Text { text: "Password"; color: "#909090"; font.bold: true; Layout.fillWidth: true }
                Item { width: 40 } // Actions
            }
        }
        
        delegate: Rectangle {
            width: parent.width
            height: 48
            color: "transparent"
            
            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 12
                anchors.rightMargin: 12
                spacing: 16
                
                ColumnLayout {
                    Layout.preferredWidth: 200
                    spacing: 2
                    Text {
                        text: modelData.site_name
                        color: "#e0e0e0"
                        font.pixelSize: 13
                        elide: Text.ElideRight
                        Layout.fillWidth: true
                    }
                    Text {
                        text: modelData.url
                        color: "#808080"
                        font.pixelSize: 11
                        elide: Text.ElideRight
                        Layout.fillWidth: true
                    }
                }
                
                Text {
                    text: modelData.username
                    color: "#e0e0e0"
                    Layout.preferredWidth: 200
                }
                
                Text {
                    text: "••••••••"
                    color: "#808080"
                    Layout.fillWidth: true
                }
                
                Button {
                    text: "👁"
                    width: 30
                    height: 30
                    flat: true
                    onClicked: {
                        console.log("Show password for", modelData.id)
                    }
                }
                
                Button {
                    text: "×"
                    width: 30
                    height: 30
                    flat: true
                    onClicked: {
                        if (appBridge) appBridge.deletePassword(modelData.id)
                    }
                }
            }
            
            MouseArea {
                anchors.fill: parent
                hoverEnabled: true
                z: -1
                onEntered: parent.color = "#2a2a2a"
                onExited: parent.color = "transparent"
            }
            
            Rectangle {
                anchors.bottom: parent.bottom
                width: parent.width
                height: 1
                color: "#2a2a2a"
            }
        }
        
        Text {
            anchors.centerIn: parent
            text: "No saved passwords"
            color: "#666666"
            visible: parent.count === 0
        }
    }
}
