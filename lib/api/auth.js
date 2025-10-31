import supabase from '../../src/config/supabaseClient.js'

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data.user
}

export async function signup(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  })
  if (error) throw error
  
  // Create profile entry
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: data.user.id,
        username,
        email
      }])
    
    if (profileError) console.error('Profile creation error:', profileError)
  }
  
  return data.user
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}