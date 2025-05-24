"use client";

import {Button} from "@/components/ui/button";
import {APP_NAME} from "@/lib/constants";
import Image from "next/image";

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Image
                src="/images/logo.svg"
                height={48}
                width={48}
                alt={`${APP_NAME} logo`}
                priority={true}
            ></Image>
            <div className="p6 rounded-lg shadow md text-center w-1/3">
                <h1 className="text-3xl font-bold mb-4">Not found</h1>
                <p className="text-destructive">could not find requested page</p>
                <Button
                    variant="outline"
                    className="mt-4 ml-2"
                    onClick={() => (window.location.href = "/")}
                >
                    Go to Home
                </Button>
            </div>
        </div>
    );
};

export default NotFoundPage;
