import { createBrowserRouter } from "react-router";
import { HomePage } from "./features/home/HomePage";
import { OrganizationList } from "./features/organization/OrganizationList";

export const router = createBrowserRouter([
    {
        path: "/home",
        element: <HomePage/>
    },
    {
        path: "/organizations",
        element: <OrganizationList />
    }
    //ovde nizemo sve rute koje imamo
])