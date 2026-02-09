import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Dialog {
    id: root
    title: "Clear Browsing Data"
    modal: true
    width: 400
    height: 350
    x: (parent.width - width) / 2
    y: (parent.height - height) / 2
    
    background: Rectangle {
        color: "#252525"
        border.width: 1
        border.color: "#404040"
        radius: 6
    }
    
    header: Rectangle {
        width: parent.width
        height: 40
        color: "transparent"
        
        Text {
            anchors.centerIn: parent
            text: root.title
            color: "#e0e0e0"
            font.bold: true
            font.pixelSize: 14
        }
        
        Rectangle {
            width: parent.width
            height: 1
            color: "#404040"
            anchors.bottom: parent.bottom
        }
    }
    
    contentItem: ColumnLayout {
        spacing: 16
        
        Text {
            text: "Time range:"
            color: "#e0e0e0"
        }
        
        ComboBox {
            Layout.fillWidth: true
            model: ["Last hour", "Last 24 hours", "Last 7 days", "All time"]
            currentIndex: 0
            
            background: Rectangle {
                color: "#333333"
                radius: 4
            }
            contentItem: Text {
                text: parent.currentText
                color: "#e0e0e0"
                leftPadding: 8
                verticalAlignment: Text.AlignVCenter
            }
        }
        
        CheckBox {
            text: "Browsing history"
            checked: true
            Layout.fillWidth: true
            contentItem: Text {
                text: parent.text
                color: "#e0e0e0"
                leftPadding: 8
                verticalAlignment: Text.AlignVCenter
            }
        }
        
        CheckBox {
            text: "Cookies and site data"
            checked: true
            Layout.fillWidth: true
            contentItem: Text {
                text: parent.text
                color: "#e0e0e0"
                leftPadding: 8
                verticalAlignment: Text.AlignVCenter
            }
        }
        
        CheckBox {
            text: "Cached images and files"
            checked: true
            Layout.fillWidth: true
            contentItem: Text {
                text: parent.text
                color: "#e0e0e0"
                leftPadding: 8
                verticalAlignment: Text.AlignVCenter
            }
        }
    }
    
    footer: Rectangle {
        width: parent.width
        height: 50
        color: "transparent"
        
        Rectangle {
            width: parent.width
            height: 1
            color: "#404040"
            anchors.top: parent.top
        }
        
        RowLayout {
            anchors.fill: parent
            anchors.margins: 12
            spacing: 12
            layoutDirection: Qt.RightToLeft
            
            Button {
                text: "Clear Data"
                
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
                
                onClicked: {
                    console.log("Clear data requested")
                    // Trigger backend logic here
                    root.close()
                }
            }
            
            Button {
                text: "Cancel"
                flat: true
                
                contentItem: Text {
                    text: parent.text
                    color: "#e0e0e0"
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                
                onClicked: root.close()
            }
        }
    }
}
