import QtQuick
import QtQuick.Window
import QtQuick.Controls

Window {
    width: 640
    height: 480
    visible: true
    color: "red"
    title: "Sanity Check"
    
    Text {
        anchors.centerIn: parent
        text: "It Works!"
    }
}
