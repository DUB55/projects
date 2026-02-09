import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects

Rectangle {
    id: speedDial
    color: "#f5f5f5"
    
    // Signals
    signal shortcutClicked(string url, string title)
    signal removeShortcutClicked(string id)
    signal settingsClicked()
    
    // Properties
    property var shortcuts: []
    property var frequentSites: []
    
    // Calculate grid columns based on window width
    readonly property int columns: Math.max(2, Math.floor((speedDial.width - 40) / 140))
    
    ScrollView {
        anchors.fill: parent
        contentWidth: parent.width
        
        Column {
            width: speedDial.width
            spacing: 24
            padding: 20
            
            // Logo and welcome
            Column {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 8
                
                Text {
                    anchors.horizontalCenter: parent.horizontalCenter
                    text: "🌐"
                    font.pixelSize: 48
                }
                
                Text {
                    anchors.horizontalCenter: parent.horizontalCenter
                    text: "New Tab"
                    font.pixelSize: 32
                    font.bold: true
                    color: "#333333"
                }
                
                Text {
                    anchors.horizontalCenter: parent.horizontalCenter
                    text: "Speed Dial - Quick access to your favorite sites"
                    font.pixelSize: 14
                    color: "#666666"
                }
            }
            
            // Shortcuts section
            Column {
                width: parent.width - 40
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 12
                
                Text {
                    text: "Shortcuts"
                    font.pixelSize: 18
                    font.bold: true
                    color: "#333333"
                }
                
                GridLayout {
                    width: parent.width
                    columns: speedDial.columns
                    columnSpacing: 12
                    rowSpacing: 12
                    
                    Repeater {
                        model: shortcuts.length > 0 ? shortcuts.length : 0
                        
                        Rectangle {
                            Layout.preferredWidth: (parent.width - (speedDial.columns - 1) * 12) / speedDial.columns
                            Layout.preferredHeight: Layout.preferredWidth
                            radius: 8
                            color: "#ffffff"
                            border.color: "#e0e0e0"
                            border.width: 1
                            
                            MouseArea {
                                anchors.fill: parent
                                hoverEnabled: true
                                onClicked: shortcutClicked(modelData.url, modelData.title)
                            }
                            
                            Column {
                                anchors.fill: parent
                                anchors.margins: 12
                                anchors.topMargin: 8
                                spacing: 8
                                
                                // Favicon
                                Rectangle {
                                    width: 32
                                    height: 32
                                    radius: 4
                                    color: modelData.color || "#4CAF50"
                                    
                                    Text {
                                        anchors.centerIn: parent
                                        text: modelData.icon || "🔗"
                                        font.pixelSize: 18
                                    }
                                }
                                
                                Item { Layout.fillHeight: true }
                                
                                // Title
                                Text {
                                    width: parent.width
                                    text: modelData.title || "Bookmark"
                                    font.pixelSize: 12
                                    font.bold: true
                                    color: "#333333"
                                    wrapMode: Text.Wrap
                                    elide: Text.ElideRight
                                    maximumLineCount: 2
                                }
                                
                                // URL
                                Text {
                                    width: parent.width
                                    text: modelData.domain || modelData.url
                                    font.pixelSize: 10
                                    color: "#999999"
                                    elide: Text.ElideRight
                                }
                                
                                // Remove button
                                Button {
                                    width: 24
                                    height: 24
                                    text: "✕"
                                    visible: false
                                    
                                    background: Rectangle {
                                        radius: 2
                                        color: "#ffebee"
                                    }
                                    
                                    onClicked: removeShortcutClicked(modelData.id)
                                }
                            }
                            
                            // Show remove button on hover
                            onHoveredChanged: {
                                // Implementation would show remove button
                            }
                        }
                    }
                    
                    // Add new shortcut button
                    Rectangle {
                        Layout.preferredWidth: (parent.width - (speedDial.columns - 1) * 12) / speedDial.columns
                        Layout.preferredHeight: Layout.preferredWidth
                        radius: 8
                        color: "#f0f0f0"
                        border.color: "#d0d0d0"
                        border.width: 2
                        border.style: Qt.DashLine
                        
                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: settingsClicked()
                        }
                        
                        Column {
                            anchors.centerIn: parent
                            spacing: 8
                            
                            Text {
                                anchors.horizontalCenter: parent.horizontalCenter
                                text: "+"
                                font.pixelSize: 32
                                color: "#999999"
                            }
                            
                            Text {
                                anchors.horizontalCenter: parent.horizontalCenter
                                text: "Add Shortcut"
                                font.pixelSize: 11
                                color: "#999999"
                            }
                        }
                    }
                }
            }
            
            // Frequent sites section
            Column {
                width: parent.width - 40
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 12
                visible: frequentSites.length > 0
                
                Text {
                    text: "Frequently Visited"
                    font.pixelSize: 18
                    font.bold: true
                    color: "#333333"
                }
                
                GridLayout {
                    width: parent.width
                    columns: speedDial.columns
                    columnSpacing: 12
                    rowSpacing: 12
                    
                    Repeater {
                        model: frequentSites.length > 0 ? frequentSites.length : 0
                        
                        Rectangle {
                            Layout.preferredWidth: (parent.width - (speedDial.columns - 1) * 12) / speedDial.columns
                            Layout.preferredHeight: Layout.preferredWidth
                            radius: 8
                            color: "#ffffff"
                            border.color: "#e0e0e0"
                            border.width: 1
                            
                            MouseArea {
                                anchors.fill: parent
                                onClicked: shortcutClicked(modelData.url, modelData.title)
                            }
                            
                            Column {
                                anchors.fill: parent
                                anchors.margins: 12
                                spacing: 8
                                
                                // Thumbnail or placeholder
                                Rectangle {
                                    width: parent.width - 24
                                    height: width
                                    anchors.horizontalCenter: parent.horizontalCenter
                                    radius: 4
                                    color: modelData.color || "#2196F3"
                                    
                                    Text {
                                        anchors.centerIn: parent
                                        text: modelData.icon || "🌐"
                                        font.pixelSize: 28
                                    }
                                }
                                
                                Item { Layout.fillHeight: true }
                                
                                // Title
                                Text {
                                    width: parent.width
                                    text: modelData.title || "Site"
                                    font.pixelSize: 11
                                    font.bold: true
                                    color: "#333333"
                                    elide: Text.ElideRight
                                }
                            }
                        }
                    }
                }
            }
            
            Item { Layout.fillHeight: true }
        }
    }
}
