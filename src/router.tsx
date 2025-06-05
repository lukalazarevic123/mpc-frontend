import { createBrowserRouter } from "react-router";
import { HomePage } from "./features/home/HomePage";
import { OrganizationPage } from "./features/organization/OrganizationPage";
import { PublicSend } from "./features/public-send/PublicSend";

export const router = createBrowserRouter([
    {
        path: "/home",
        element: <HomePage/>
    },
    {
        path: "/organizations",
        element: <OrganizationPage />
    },
    {
        path: "/send",
        element: <PublicSend />
    }
    //ovde nizemo sve rute koje imamo
])