import QtQuick
import QtQuick.Controls
import QtQuick.Shapes

Button {
    id: control
    
    // Icon properties
    property string iconPath: ""
    property int iconSize: 24
    
    // Style properties
    property color iconColor: "#e0e0e0"
    property color hoverColor: "#ffffff"
    property real hoverOpacity: 0.1
    property int size: 40
    property bool isActive: false

    width: size
    height: size
    
    // Glass Background
    background: Rectangle {
        color: control.isActive ? Qt.rgba(1, 1, 1, 0.15) : (control.hovered ? Qt.rgba(1, 1, 1, 0.1) : "transparent")
        radius: 12
        border.width: (control.hovered || control.isActive) ? 1 : 0
        border.color: Qt.rgba(1, 1, 1, 0.2)
        scale: control.pressed ? 0.95 : 1.0
        
        Behavior on color { ColorAnimation { duration: 150 } }
        Behavior on border.color { ColorAnimation { duration: 150 } }
        Behavior on scale { NumberAnimation { duration: 100; easing.type: Easing.OutQuad } }
    }
    
    contentItem: Item {
        anchors.fill: parent
        
        // Render SVG Path
        Shape {
            anchors.centerIn: parent
            width: control.iconSize
            height: control.iconSize
            visible: control.iconPath !== ""
            
            ShapePath {
                strokeWidth: 0
                strokeColor: "transparent"
                fillColor: !control.enabled ? "#666666" : 
                          (control.hovered || control.isActive ? "#ffffff" : control.iconColor)
                
                PathSvg { path: control.iconPath }
            }
        }
        
        // Fallback or additional text (only if iconPath is empty)
        Text {
            anchors.centerIn: parent
            visible: control.iconPath === ""
            text: control.text
            font.pixelSize: 18
            color: !control.enabled ? "#666666" : 
                  (control.hovered || control.isActive ? "#ffffff" : control.iconColor)
        }
    }
}
