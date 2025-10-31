import supabase from '../../src/config/supabaseClient.js'

export async function getUserReviews() {

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      cafes (
        cafe_name,
        address,
        image_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}