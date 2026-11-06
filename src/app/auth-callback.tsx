import {Redirect} from "expo-router";
import {ROUTES} from "@/constants/routes";

/**
 * Where Google sign-in returns to in the app. The sign-in screen reads the session from the link itself;
 * on Android the link may also open this route, which simply goes home.
 */
const AuthCallback = () => <Redirect href={ROUTES.HOME}/>;

export default AuthCallback;
