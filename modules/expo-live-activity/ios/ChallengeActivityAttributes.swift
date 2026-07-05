import ActivityKit

// NOTE: This struct is duplicated byte-for-byte in modules/expo-live-activity/ios/.
// ActivityKit matches the running activity to the widget by this type's name + ContentState,
// so both copies must stay identical.

struct ChallengeGolfer: Codable, Hashable {
  var name: String
  var avatarIndex: Int
  var challenge: String
  var result: String // "", "achieved", or "failed"
  var cards: Int // running poker-card count so far
}

@available(iOS 16.1, *)
struct ChallengeActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var hole: Int
    var phase: String
    var matchup: String // non-empty on matchup holes = the shared challenge text
    var golfers: [ChallengeGolfer]
  }
}
