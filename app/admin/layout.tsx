import Link from "next/link";
import Image from "next/image";
import {APP_NAME} from "@/lib/constants";
import Menu from "@/components/shared/header/menu";
import {Input} from "@/components/ui/input";
import {ReactNode} from "react";
import MainNav from "@/app/admin/main-nav";

export default function AdminLayout(
    {
        children,
    }: Readonly<{
        children: ReactNode;
    }>) {
    return (
        <>
            <div className="flex flex-col">
                <div className="border-b container mx-auto">
                    <div className="flex items-center h-16 px-4">
                        <Link href="/" className="w-22 no-underline hover:text-gray-600 text-inherit">
                            <Image src="/images/logo.svg" alt={APP_NAME} height={48} width={48}/>
                        </Link>
                        <MainNav className="mx-6"/>
                        <div className="ml-auto items-center flex space-x-4">
                            <div>
                                <Input type="search" placeholder="Search..." className="md:w-[300px]"/>
                            </div>
                            <Menu/>
                        </div>
                    </div>
                </div>
                <div className="flex-1 space-y-4 p-8 pt-6 container mx-auto">
                    {children}
                </div>
            </div>
        </>
    );
}
