import ActivityKit
import WidgetKit
import SwiftUI

private let goldColor = Color(red: 1.0, green: 0.84, blue: 0.42)
private let matchupColor = Color(red: 0.85, green: 0.51, blue: 0.17)

@main
struct CaddyWidgetsBundle: WidgetBundle {
  var body: some Widget {
    ChallengeLiveActivity()
  }
}

struct ChallengeLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: ChallengeActivityAttributes.self) { context in
      LockScreenView(state: context.state)
        .padding(14)
        .activityBackgroundTint(Color(red: 0.043, green: 0.122, blue: 0.09))
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Label("Hole \(context.state.hole)", systemImage: "flag.fill")
            .font(.caption).fontWeight(.bold).foregroundStyle(goldColor)
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(achievedText(context.state)).font(.caption).fontWeight(.bold).foregroundStyle(.secondary)
        }
        DynamicIslandExpandedRegion(.bottom) {
          if !context.state.matchup.isEmpty {
            MatchupView(state: context.state, compact: true)
          } else {
            GolferGrid(golfers: context.state.golfers, compact: true)
          }
        }
      } compactLeading: {
        Image(systemName: "flag.fill").foregroundStyle(goldColor)
      } compactTrailing: {
        Text(achievedText(context.state)).font(.caption2)
      } minimal: {
        Image(systemName: "flag.fill").foregroundStyle(goldColor)
      }
    }
  }

  private func achievedText(_ s: ChallengeActivityAttributes.ContentState) -> String {
    let done = s.golfers.filter { $0.result == "achieved" }.count
    return "\(done)/\(s.golfers.count)"
  }
}

/* ----------------- shared pieces ----------------- */

func golferAvatar(_ index: Int, size: CGFloat) -> some View {
  Image("golfer-\(index)")
    .resizable()
    .scaledToFill()
    .frame(width: size, height: size)
    .clipShape(Circle())
    .overlay(Circle().stroke(.white.opacity(0.25), lineWidth: 1))
}

@ViewBuilder
func resultBadge(_ result: String) -> some View {
  if result == "achieved" {
    Image(systemName: "checkmark.circle.fill").foregroundStyle(.green).font(.caption2)
  } else if result == "failed" {
    Image(systemName: "xmark.circle.fill").foregroundStyle(.red).font(.caption2)
  }
}

/// Per-player poker-card chips (initial + running count), shown in the header.
struct ScoreChipsRow: View {
  let golfers: [ChallengeGolfer]

  private func initial(_ name: String) -> String {
    String(name.trimmingCharacters(in: .whitespaces).prefix(1)).uppercased()
  }

  var body: some View {
    HStack(spacing: 4) {
      ForEach(Array(golfers.enumerated()), id: \.offset) { _, g in
        HStack(spacing: 3) {
          Text(initial(g.name)).font(.caption2).fontWeight(.heavy).foregroundStyle(.white)
          Text("\(g.cards)").font(.caption2).fontWeight(.heavy).foregroundStyle(goldColor)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(Capsule().fill(.white.opacity(0.15)))
      }
    }
  }
}

/* ----------------- lock screen ----------------- */

struct LockScreenView: View {
  let state: ChallengeActivityAttributes.ContentState

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(spacing: 6) {
        Label("Hole \(state.hole)", systemImage: "flag.fill")
          .font(.headline).foregroundStyle(.white)
        Spacer(minLength: 4)
        ScoreChipsRow(golfers: state.golfers)
      }
      if !state.matchup.isEmpty {
        MatchupView(state: state, compact: false)
      } else {
        GolferGrid(golfers: state.golfers, compact: false)
      }
    }
  }
}

/* ----------------- matchup ----------------- */

struct MatchupView: View {
  let state: ChallengeActivityAttributes.ContentState
  let compact: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: compact ? 3 : 6) {
      Text("⚔️ Matchup!")
        .font(compact ? .caption : .subheadline).fontWeight(.heavy)
        .foregroundStyle(matchupColor)
      Text(state.matchup)
        .font(compact ? .caption : .callout).fontWeight(.semibold)
        .foregroundStyle(.white)
        .fixedSize(horizontal: false, vertical: true)
      HStack(spacing: compact ? 10 : 14) {
        ForEach(Array(state.golfers.enumerated()), id: \.offset) { _, g in
          HStack(spacing: 4) {
            golferAvatar(g.avatarIndex, size: compact ? 22 : 28)
            if !compact {
              Text(g.name).font(.caption2).foregroundStyle(.white).lineLimit(1)
            }
            resultBadge(g.result)
          }
        }
      }
    }
  }
}

/* ----------------- golfers (1 col ≤2, 2 cols >2) ----------------- */

struct GolferGrid: View {
  let golfers: [ChallengeGolfer]
  let compact: Bool

  var body: some View {
    if golfers.count > 2 {
      let cols = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]
      LazyVGrid(columns: cols, alignment: .leading, spacing: compact ? 5 : 8) {
        ForEach(Array(golfers.enumerated()), id: \.offset) { _, g in
          GolferCell(golfer: g)
        }
      }
    } else {
      VStack(alignment: .leading, spacing: compact ? 4 : 6) {
        ForEach(Array(golfers.enumerated()), id: \.offset) { _, g in
          GolferRow(golfer: g, compact: compact)
        }
      }
    }
  }
}

/// Single-column row (used when ≤2 golfers). Challenge reserves 2 lines so every row is the
/// same height and top-left justified.
struct GolferRow: View {
  let golfer: ChallengeGolfer
  let compact: Bool

  var body: some View {
    HStack(alignment: .top, spacing: 8) {
      golferAvatar(golfer.avatarIndex, size: compact ? 26 : 34)
      VStack(alignment: .leading, spacing: 1) {
        Text(golfer.name)
          .font(compact ? .caption2 : .caption).fontWeight(.bold)
          .foregroundStyle(.white).lineLimit(1)
        Text(golfer.challenge)
          .font(.caption2).foregroundStyle(.white.opacity(0.75))
          .lineLimit(2, reservesSpace: true)
      }
      Spacer(minLength: 4)
      resultBadge(golfer.result)
    }
  }
}

/// Compact 2-column cell (used when >2 golfers). Challenge reserves 2 lines so every cell is
/// the same height and top-left justified.
struct GolferCell: View {
  let golfer: ChallengeGolfer

  var body: some View {
    HStack(alignment: .top, spacing: 6) {
      golferAvatar(golfer.avatarIndex, size: 24)
      VStack(alignment: .leading, spacing: 1) {
        HStack(spacing: 3) {
          Text(golfer.name).font(.caption2).fontWeight(.bold).foregroundStyle(.white).lineLimit(1)
          resultBadge(golfer.result)
        }
        Text(golfer.challenge)
          .font(.system(size: 11)).foregroundStyle(.white.opacity(0.75))
          .lineLimit(2, reservesSpace: true)
      }
      Spacer(minLength: 0)
    }
  }
}
