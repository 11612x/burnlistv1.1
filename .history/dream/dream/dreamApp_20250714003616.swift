import SwiftUI
import AppKit

@main
struct dreamApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        Settings {
            EmptyView()
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem?
    var popover: NSPopover?
    var colorManager: ColorManager?
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Hide the dock icon since this is a menu bar app
        NSApp.setActivationPolicy(.accessory)
        
        // Initialize color manager
        colorManager = ColorManager()
        
        // Create status item (menu bar icon)
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem?.button {
            if let image = NSImage(named: "toolbar.png") ?? NSImage(contentsOfFile: Bundle.main.path(forResource: "toolbar", ofType: "png") ?? "") {
                image.size = NSSize(width: 24, height: 24)
                button.image = image
            } else {
                button.image = NSImage(systemSymbolName: "lightbulb.fill", accessibilityDescription: "dream")
            }
            button.action = #selector(togglePopover)
            button.target = self
        }
        
        // Create popover
        popover = NSPopover()
        popover?.contentSize = NSSize(width: 300, height: 400)
        popover?.behavior = .transient
        popover?.contentViewController = NSHostingController(rootView: ContentView(colorManager: colorManager!))
    }
    
    @objc func togglePopover() {
        if let button = statusItem?.button {
            if popover?.isShown == true {
                popover?.performClose(nil)
            } else {
                popover?.show(relativeTo: button.bounds, of: button, preferredEdge: NSRectEdge.minY)
                popover?.contentViewController?.view.window?.makeKey()
            }
        }
    }
} 