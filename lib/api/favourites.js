import supabase from '../../src/config/supabaseClient.js'

export async function getFavouriteCafes() {

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('user_favourites')
    .select(`
      *,
      cafes (
        id,
        cafe_name,
        address,
        rating,
        image_url,
        wifi,
        power_outlets,
        price_range
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function addFavourite(cafeId) {

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('user_favourites')
    .insert({ cafe_id: cafeId, user_id: user.id })
  
  if (error) throw error
  return data
}

export async function removeFavourite(cafeId) {

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('user_favourites')
    .delete()
    .eq('cafe_id', cafeId)
    .eq('user_id', user.id)
  
  if (error) throw error
  return data
}

export async function checkIfFavourite(cafeId) {

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return false

  const { data, error } = await supabase
    .from('user_favourites')
    .select('id')
    .eq('cafe_id', cafeId)
    .eq('user_id', user.id)
    .single()
  
  return !error && data
}