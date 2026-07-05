/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "widget",
  name: "CaddyWidgets",
  deploymentTarget: "16.2",
  frameworks: ["SwiftUI", "WidgetKit", "ActivityKit"],
  // Downscaled golfer avatars, referenced in SwiftUI as Image("golfer-0")…("golfer-7").
  images: {
    "golfer-0": "./img/golfer-0.png",
    "golfer-1": "./img/golfer-1.png",
    "golfer-2": "./img/golfer-2.png",
    "golfer-3": "./img/golfer-3.png",
    "golfer-4": "./img/golfer-4.png",
    "golfer-5": "./img/golfer-5.png",
    "golfer-6": "./img/golfer-6.png",
    "golfer-7": "./img/golfer-7.png",
  },
};
