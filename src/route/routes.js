import {
    createWebHistory,
    createRouter
} from "vue-router";
import supabase from '../config/supabaseClient';

import home from '../components/home.vue';
import tasks from '../components/tasks.vue';
import crowd from '../components/crowd.vue';
import reward from '../components/reward.vue';
import reviews from '../components/reviews.vue';
import profile_home from '../components/profile_home.vue'; // add in user icon hover
import cafe_review from '../components/cafe_review.vue';
import map from "../components/map.vue";
import studyPlanner from "@/components/studyPlanner.vue";
import camera from "@/components/camera.vue";
import login_view from "../components/login_view.vue";
import my_reviews from "../components/my_reviews.vue";
import favourites from "../components/favourites.vue"; // add in user icon hover

const history = createWebHistory()
const routes = [

	{
		path: "/",
		name: "home",
		component: home,
		meta: { requiresAuth: false, title: "Home" },
	},

	{
		path: "/login",
		name: "login",
		component: login_view,
		meta: { requiresAuth: false, title: "Login" }
	},

	{
		path: "/profile_home",
		name: "profile_home",
		component: profile_home,
		meta: { requiresAuth: true, title: "Profile_home" },
	},

	{
		path: "/tasks",
		name: "tasks",
		component: tasks,
		meta: { requiresAuth: true, title: "Tasks" },
	},

	{
		path: "/crowd",
		name: "crowd",
		component: crowd,
		meta: { requiresAuth: true, title: "Crowd" },
	},

	{
		path: "/reward",
		name: "reward",
		component: reward,
		meta: { requiresAuth: true, title: "Rewards" },
	},

	{
		path: "/reviews",
		name: "reviews",
		component: reviews,
		meta: { requiresAuth: true, title: "Reviews" },
	},

	{
		path: "/my-reviews",
		name: "my_reviews",
		component: my_reviews,
		meta: { requiresAuth: true, title: "My Reviews" }
	},

	{
		path: "/favourites",
		name: "favourites",
		component: favourites,
		meta: { requiresAuth: true, title: "Favourites" }
	},

	{
		path: "/cafe_review/:id",
		name: "cafe_review",
		component: cafe_review,
		meta: { requiresAuth: true, title: "Cafe Review"}
	},

	{
		path: "/map",
		name: "map",
		component: map,
		meta: { requiresAuth: true, title: "Map"}
	},

	{
		path: "/studyPlanner",
		name: "studyPlanner",
		component: studyPlanner,
		meta: { requiresAuth: true, title: "Study Planner"}
	},

	{
		path: "/camera",
		name: "camera",
		component: camera,
		meta: { requiresAuth: true, title: "Camera"}
	},
];

const router = createRouter({
    history,
    routes
});

// Authentication guard
router.beforeEach(async (to, from, next) => {
	document.title = to.meta.title || "MAP & MUG";

	const { data: { session } } = await supabase.auth.getSession();

	if (to.meta.requiresAuth && !session) {
		// Redirect to login if trying to access protected route
		next('/login');
	} else if (to.path === '/login' && session) {
		// Redirect to home if already logged in and trying to access login
		next('/');
	} else {
		next();
	}
});

export default router;
