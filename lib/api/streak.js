import supabase from '../../src/config/supabaseClient.js'

/**
 * Get all photo dates for the current user
 */
async function getPhotoDates(userId) {
  try {
    const { data, error } = await supabase.storage
      .from('photos')
      .list(userId)

    if (error || !data) return []

    // Extract dates from filenames (format: {timestamp}.png)
    const dates = data
      .map(file => {
        const timestamp = parseInt(file.name.split('.')[0])
        if (!isNaN(timestamp)) {
          const date = new Date(timestamp)
          // Return date in YYYY-MM-DD format
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        return null
      })
      .filter(Boolean)

    // Remove duplicates and sort
    return [...new Set(dates)].sort()
  } catch (err) {
    console.error('Error getting photo dates:', err)
    return []
  }
}

/**
 * Calculate current streak from photo dates
 */
function calculateStreak(dates) {
  if (dates.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let currentDate = new Date(today)

  // Check from today backwards
  for (let i = dates.length - 1; i >= 0; i--) {
    const dateStr = dates[i]
    const [year, month, day] = dateStr.split('-').map(Number)
    const photoDate = new Date(year, month - 1, day)

    if (currentDate.getTime() === photoDate.getTime()) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (currentDate > photoDate) {
      // Gap found, streak broken
      break
    }
  }

  return streak
}

/**
 * Award points to user
 */
export async function awardPoints(userId, amount, reason) {
  try {
    const now = new Date()
    // Points expire after 30 days
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('points')
      .insert([
        {
          user_id: userId,
          amount: amount,
          reason: reason,
          earned_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_used: false
        }
      ])

    if (error) {
      console.error('Error awarding points:', error.message, error.details, error.hint)
      return false
    }

    console.log(`✅ Successfully awarded ${amount} points to user ${userId}`)
    console.log('Insert response:', data)
    return true
  } catch (err) {
    console.error('Error awarding points:', err)
    return false
  }
}

/**
 * Get current streak for user
 */
export async function getUserStreak(userId) {
  try {
    const dates = await getPhotoDates(userId)
    const streak = calculateStreak(dates)
    return streak
  } catch (err) {
    console.error('Error getting user streak:', err)
    return 0
  }
}

/**
 * Check streak and award points if milestone reached
 * Call this after a photo is uploaded
 */
export async function checkAndAwardStreakPoints(userId) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('User not authenticated')
      return { success: false, streak: 0, pointsAwarded: 0 }
    }

    const dates = await getPhotoDates(userId)
    const streak = calculateStreak(dates)

    console.log(`📊 Streak calculation: ${dates.length} unique dates, streak: ${streak} days`)

    let pointsAwarded = 0
    let milestone = false

    // Award 5 points for every 5 consecutive days
    if (streak > 0 && streak % 5 === 0) {
      console.log('🎯 Streak is a 5-day milestone - awarding points!')
      const success = await awardPoints(
        userId,
        5,
        `Daily photo streak milestone: ${streak} consecutive days!`
      )
      if (success) {
        pointsAwarded = 5
        milestone = true
        console.log('✅ Points awarded successfully')
      } else {
        console.log('❌ Failed to award points')
      }
    } else {
      console.log(`⏭️ Streak is ${streak} days, not a 5-day milestone - no points awarded`)
    }

    return {
      success: true,
      streak: streak,
      pointsAwarded: pointsAwarded,
      milestone: milestone
    }
  } catch (err) {
    console.error('Error checking streak:', err)
    return { success: false, streak: 0, pointsAwarded: 0 }
  }
}
