"use client";

import {HTMLAttributes} from "react";
import {cn} from "@/lib/utils";
import Link from "next/link";
import {usePathname} from "next/navigation";

const links = [
    {
        title: "Overview",
        href: "/admin/overview",
    }, {
        title: "Products",
        href: "/admin/products",
    },
    {
        title: "Orders",
        href: "/admin/orders",
    },
    {
        title: "Users",
        href: "/admin/users",
    }
]
const MainNav = ({className, ...props}: HTMLAttributes<HTMLElement>) => {
    const pathName = usePathname()
    return (
        <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}{...props}>
            {links.map(item => (
                <Link key={item.href} href={item.href}
                      className={cn("no-underline hover:text-primary text-inherit text-sm font-medium transition-colors", pathName.includes(item.href) ? "" : "text-muted-foreground")}>{item.title}</Link>
            ))}
        </nav>
    )
}

export default MainNav;