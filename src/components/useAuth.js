import { ref, computed } from "vue";
import supabase from "../config/supabaseClient";

const user = ref(null);
const loading = ref(false);
const error = ref(null);

export function useAuth() {
	const isAuthenticated = computed(() => !!user.value);

	// Sign up new user
	const signUp = async (email, password, username) => {
		loading.value = true;
		error.value = null;

		try {
			const { data, error: signUpError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						username: username,
					},
				},
			});

			if (signUpError) throw signUpError;

			user.value = data.user;
			return { success: true, data };
		} catch (e) {
			error.value = e.message;
			return { success: false, error: e.message };
		} finally {
			loading.value = false;
		}
	};

	// Sign in with email or username
	const signIn = async (emailOrUsername, password) => {
		loading.value = true;
		error.value = null;

		try {
			let email = emailOrUsername;

			// Check if input is a username (doesn't contain @)
			if (!emailOrUsername.includes("@")) {
				// Look up email by username
				const { data: profileData, error: profileError } = await supabase
					.from("profiles")
					.select("email")
					.eq("username", emailOrUsername)
					.single();

				if (profileError || !profileData) {
					throw new Error("Invalid email, username or password");
				}

				email = profileData.email;
			}

			// Sign in with email
			const { data, error: signInError } =
				await supabase.auth.signInWithPassword({
					email,
					password,
				});

			if (signInError) throw signInError;

			user.value = data.user;
			return { success: true, data };
		} catch (e) {
			error.value = e.message;
			return { success: false, error: e.message };
		} finally {
			loading.value = false;
		}
	};

	// Sign out
	const signOut = async () => {
		loading.value = true;
		error.value = null;

		try {
			const { error: signOutError } = await supabase.auth.signOut();
			if (signOutError) throw signOutError;

			user.value = null;
			return { success: true };
		} catch (e) {
			error.value = e.message;
			return { success: false, error: e.message };
		} finally {
			loading.value = false;
		}
	};

	// Get current session
	const getCurrentUser = async () => {
		loading.value = true;

		try {
			const {
				data: { user: currentUser },
			} = await supabase.auth.getUser();
			user.value = currentUser;
			return currentUser;
		} catch (e) {
			error.value = e.message;
			return null;
		} finally {
			loading.value = false;
		}
	};

	// Listen to auth state changes
	const initAuthListener = () => {
		supabase.auth.onAuthStateChange((event, session) => {
			user.value = session?.user || null;
		});
	};

	return {
		user,
		loading,
		error,
		isAuthenticated,
		signUp,
		signIn,
		signOut,
		getCurrentUser,
		initAuthListener,
	};
}
