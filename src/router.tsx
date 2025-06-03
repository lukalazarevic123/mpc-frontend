import { createBrowserRouter } from "react-router";
import { HomePage } from "./features/home/HomePage";
import { OrganizationPage } from "./features/organization/OrganizationPage";

export const router = createBrowserRouter([
    {
        path: "/home",
        element: <HomePage/>
    },
    {
        path: "/organizations",
        element: <OrganizationPage />
    }
    //ovde nizemo sve rute koje imamo
])