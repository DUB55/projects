import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: profileSwitcher
    width: 250
    height: contentColumn.implicitHeight + 16
    radius: 4
    color: "#ffffff"
    border.color: "#e0e0e0"
    border.width: 1
    
    // Signals
    signal profileSelected(string profileId, string profileName)
    signal createProfileClicked()
    signal editProfileClicked(string profileId)
    signal deleteProfileClicked(string profileId)
    
    // Properties
    property var profiles: []
    property string currentProfileId: ""
    property string currentProfileName: "Default"
    property string currentProfileColor: "#4CAF50"
    
    Column {
        id: contentColumn
        anchors.fill: parent
        anchors.margins: 8
        spacing: 8
        
        // Current profile display
        Rectangle {
            width: parent.width
            height: 40
            radius: 4
            color: currentProfileColor
            opacity: 0.2
            
            RowLayout {
                anchors.fill: parent
                anchors.margins: 8
                spacing: 8
                
                // Profile color indicator
                Rectangle {
                    width: 24
                    height: 24
                    radius: 4
                    color: currentProfileColor
                }
                
                // Profile name
                Text {
                    text: currentProfileName
                    font.pixelSize: 14
                    font.bold: true
                    color: "#333333"
                    Layout.fillWidth: true
                }
                
                // Checkmark for active
                Text {
                    text: "✓"
                    font.pixelSize: 16
                    color: currentProfileColor
                }
            }
        }
        
        // Divider
        Rectangle {
            width: parent.width
            height: 1
            color: "#f0f0f0"
        }
        
        // Profiles list
        ListView {
            id: profilesList
            width: parent.width
            height: Math.min(contentHeight, 200)
            spacing: 4
            clip: true
            
            model: profiles.length > 0 ? profiles.length : 0
            
            delegate: Rectangle {
                id: profileItem
                width: profilesList.width
                height: 40
                radius: 4
                color: modelData.id === currentProfileId ? "#f5f5f5" : "#ffffff"
                border.color: modelData.id === currentProfileId ? "#d0d0d0" : "transparent"
                
                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 8
                    spacing: 8
                    
                    // Profile icon/color
                    Rectangle {
                        width: 24
                        height: 24
                        radius: 4
                        color: modelData.icon_color || "#9E9E9E"
                    }
                    
                    // Profile name
                    Text {
                        text: modelData.name || "Unnamed"
                        font.pixelSize: 13
                        color: "#333333"
                        Layout.fillWidth: true
                    }
                    
                    // Delete button
                    Button {
                        text: "✕"
                        width: 24
                        height: 24
                        font.pixelSize: 12
                        visible: profiles.length > 1 && modelData.id !== currentProfileId
                        
                        background: Rectangle {
                            radius: 2
                            color: parent.hovered ? "#ffebee" : "transparent"
                        }
                        
                        onClicked: deleteProfileClicked(modelData.id)
                    }
                }
                
                MouseArea {
                    anchors.fill: parent
                    enabled: modelData.id !== currentProfileId
                    onClicked: profileSelected(modelData.id, modelData.name)
                }
            }
            
            ScrollBar.vertical: ScrollBar {
                active: true
                policy: ScrollBar.AsNeeded
            }
        }
        
        // Divider
        Rectangle {
            width: parent.width
            height: 1
            color: "#f0f0f0"
        }
        
        // Create new profile button
        Button {
            width: parent.width
            height: 36
            text: "+ New Profile"
            
            background: Rectangle {
                radius: 4
                color: parent.hovered ? "#f0f0f0" : "#ffffff"
                border.color: "#d0d0d0"
            }
            
            contentItem: Text {
                text: parent.text
                color: "#0078D4"
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
                font.pixelSize: 13
            }
            
            onClicked: createProfileClicked()
        }
    }
}
