import ActivityKit
import ExpoModulesCore

public class LiveActivityModule: Module {
  // Stored as Any? so the class isn't gated behind @available; cast on use.
  private var currentActivity: Any?

  public func definition() -> ModuleDefinition {
    Name("LiveActivity")

    // Build-channel detection (used to gate dev-only tools in JS). TestFlight ships a
    // "sandboxReceipt"; the App Store ships a production "receipt". Dev builds have no
    // production receipt either, so this is false anywhere except App Store production.
    Function("isProductionAppStore") { () -> Bool in
      Bundle.main.appStoreReceiptURL?.lastPathComponent == "receipt"
    }

    Function("areEnabled") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    Function("start") { (payload: [String: Any]) in
      if #available(iOS 16.2, *) {
        self.startActivity(payload)
      }
    }

    Function("update") { (payload: [String: Any]) in
      if #available(iOS 16.2, *) {
        self.updateActivity(payload)
      }
    }

    Function("end") {
      if #available(iOS 16.2, *) {
        self.endActivity()
      }
    }
  }

  @available(iOS 16.2, *)
  private func contentState(from payload: [String: Any]) -> ChallengeActivityAttributes.ContentState {
    let hole = payload["hole"] as? Int ?? 0
    let phase = payload["phase"] as? String ?? ""
    let matchup = payload["matchup"] as? String ?? ""
    let golfersRaw = payload["golfers"] as? [[String: Any]] ?? []
    let golfers = golfersRaw.map { g in
      ChallengeGolfer(
        name: g["name"] as? String ?? "",
        avatarIndex: g["avatarIndex"] as? Int ?? 0,
        challenge: g["challenge"] as? String ?? "",
        result: g["result"] as? String ?? "",
        cards: g["cards"] as? Int ?? 0
      )
    }
    return ChallengeActivityAttributes.ContentState(hole: hole, phase: phase, matchup: matchup, golfers: golfers)
  }

  @available(iOS 16.2, *)
  private func startActivity(_ payload: [String: Any]) {
    endActivity()
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
    let state = contentState(from: payload)
    do {
      let activity = try Activity<ChallengeActivityAttributes>.request(
        attributes: ChallengeActivityAttributes(),
        content: ActivityContent(state: state, staleDate: nil),
        pushType: nil
      )
      self.currentActivity = activity
    } catch {
      // Ignore — activity couldn't be started.
    }
  }

  @available(iOS 16.2, *)
  private func updateActivity(_ payload: [String: Any]) {
    guard let activity = self.currentActivity as? Activity<ChallengeActivityAttributes> else {
      startActivity(payload)
      return
    }
    let state = contentState(from: payload)
    Task {
      await activity.update(ActivityContent(state: state, staleDate: nil))
    }
  }

  @available(iOS 16.2, *)
  private func endActivity() {
    guard let activity = self.currentActivity as? Activity<ChallengeActivityAttributes> else { return }
    self.currentActivity = nil
    Task {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }
}
