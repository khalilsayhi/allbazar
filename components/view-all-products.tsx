import {Button} from './ui/button';
import Link from 'next/link';

const ViewAllProductsButton = () => {
    return (
        <div className='flex justify-center items-center my-8'>
            <Button asChild className='px-8 py-4 text-lg font-semibold h-[12px]'>
                <Link href='/search' className="no-underline text-inherit hover:text-primary">View All Products</Link>
            </Button>
        </div>
    );
};

export default ViewAllProductsButton;