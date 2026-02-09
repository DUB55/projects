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
                text: "Settings"
                color: "#e0e0e0"
                font.bold: true
                font.pixelSize: 18
            }
        }
    }
    
    // --- Settings Categories ---
    ListModel {
        id: settingsCategories
        ListElement { name: "Reset Settings"; icon: "reset"; category: "reset" }
        ListElement { name: "About Browser"; icon: "info"; category: "about" }
        ListElement { name: "Languages"; icon: "language"; category: "languages" }
        ListElement { name: "Downloads"; icon: "download"; category: "downloads" }
        ListElement { name: "System"; icon: "system"; category: "system" }
        ListElement { name: "Accessibility"; icon: "accessibility"; category: "accessibility" }
        ListElement { name: "Design"; icon: "design"; category: "design" }
        ListElement { name: "Performance"; icon: "performance"; category: "performance" }
        ListElement { name: "Privacy & Security"; icon: "security"; category: "privacy" }
        ListElement { name: "Auto-fill Passwords"; icon: "key"; category: "passwords" }
    }

    property string currentCategory: "design"

    RowLayout {
        anchors.fill: parent
        anchors.topMargin: header.height
        spacing: 0

        // Sidebar
        Rectangle {
            Layout.fillHeight: true
            Layout.preferredWidth: 200
            color: "#252525"

            ListView {
                anchors.fill: parent
                anchors.margins: 8
                model: settingsCategories
                delegate: ItemDelegate {
                    width: parent.width
                    height: 40
                    background: Rectangle {
                        color: root.currentCategory === model.category ? "#3a3a3a" : "transparent"
                        radius: 6
                    }
                    contentItem: Text {
                        text: model.name
                        color: root.currentCategory === model.category ? "#4a9eff" : "#e0e0e0"
                        verticalAlignment: Text.AlignVCenter
                        leftPadding: 12
                    }
                    onClicked: root.currentCategory = model.category
                }
            }
        }

        // Content Area
        ScrollView {
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true

            ColumnLayout {
                width: Math.min(600, parent.width - 80)
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.top: parent.top
                anchors.topMargin: 40
                spacing: 32

                // --- Design Section ---
                ColumnLayout {
                    visible: root.currentCategory === "design"
                    Layout.fillWidth: true
                    spacing: 16
                    Text { text: "Design"; color: "#4a9eff"; font.bold: true; font.pixelSize: 20 }
                    
                    RowLayout {
                        Layout.fillWidth: true
                        Text { text: "Theme"; color: "#e0e0e0"; Layout.fillWidth: true }
                        ComboBox {
                            model: ["Auto", "Dark", "Light"]
                            onActivated: if (appBridge) appBridge.setSetting("theme", ["auto", "dark", "light"][index])
                        }
                    }
                    
                    RowLayout {
                        Layout.fillWidth: true
                        Text { text: "Accent Color"; color: "#e0e0e0"; Layout.fillWidth: true }
                        ComboBox {
                            model: ["Blue", "Purple", "Green", "Orange"]
                            onActivated: if (appBridge) appBridge.setSetting("accent_color", ["#0078D4", "#6B69D6", "#107C10", "#D83B01"][index])
                        }
                    }
                }

                // --- Privacy Section ---
                ColumnLayout {
                    visible: root.currentCategory === "privacy"
                    Layout.fillWidth: true
                    spacing: 16
                    Text { text: "Privacy & Security"; color: "#4a9eff"; font.bold: true; font.pixelSize: 20 }
                    
                    Button {
                        text: "Clear Browsing Data"
                        onClicked: if (appBridge) appBridge.clearAllHistory()
                    }
                }

                // --- Passwords Section ---
                ColumnLayout {
                    visible: root.currentCategory === "passwords"
                    Layout.fillWidth: true
                    spacing: 16
                    Text { text: "Passwords"; color: "#4a9eff"; font.bold: true; font.pixelSize: 20 }
                    
                    CheckBox {
                        text: "Offer to save passwords"
                        checked: true
                        contentItem: Text { text: parent.text; color: "#e0e0e0"; leftPadding: 30 }
                    }
                }

                // --- Performance Section ---
                ColumnLayout {
                    visible: root.currentCategory === "performance"
                    Layout.fillWidth: true
                    spacing: 16
                    Text { text: "Performance"; color: "#4a9eff"; font.bold: true; font.pixelSize: 20 }
                    
                    CheckBox {
                        text: "Hardware Acceleration"
                        checked: true
                        contentItem: Text { text: parent.text; color: "#e0e0e0"; leftPadding: 30 }
                    }
                }

                // --- Reset Section ---
                ColumnLayout {
                    visible: root.currentCategory === "reset"
                    Layout.fillWidth: true
                    spacing: 16
                    Text { text: "Reset Settings"; color: "#4a9eff"; font.bold: true; font.pixelSize: 20 }
                    
                    Text { 
                        text: "This will reset all settings to their default values. This action cannot be undone."; 
                        color: "#909090"; wrapMode: Text.WordWrap; Layout.fillWidth: true 
                    }
                    
                    Button {
                        text: "Reset All Settings"
                        onClicked: if (appBridge) appBridge.resetSettings()
                    }
                }

                // --- About Section ---
                ColumnLayout {
                    visible: root.currentCategory === "about"
                    Layout.fillWidth: true
                    spacing: 16
                    Text { text: "About Browser"; color: "#4a9eff"; font.bold: true; font.pixelSize: 20 }
                    Text { text: "Modern Desktop Browser v0.1.0"; color: "#e0e0e0" }
                    Text { text: "Powered by Qt6 & Python"; color: "#909090"; font.pixelSize: 12 }
                }
            }
        }
    }
}
