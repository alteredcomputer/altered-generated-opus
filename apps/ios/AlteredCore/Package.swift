// swift-tools-version: 6.2
// AlteredCore: the editor's model, rules, and sync engine with no UI. Foundation and Observation
// only, so it builds and tests on Linux as well as on the Mac.
import PackageDescription

let package = Package(
    name: "AlteredCore",
    platforms: [.iOS(.v26), .macOS(.v15)],
    products: [.library(name: "AlteredCore", targets: ["AlteredCore"])],
    targets: [
        .target(name: "AlteredCore"),
        .testTarget(name: "AlteredCoreTests", dependencies: ["AlteredCore"])
    ]
)
