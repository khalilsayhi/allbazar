import {Metadata} from 'next';
import {requireAdmin} from "@/lib/auth-gard";
import ProductForm from "@/components/admin/product-form";

export const metadata: Metadata = {
    title: 'Create Product',
};

const CreateProductPage = async () => {
    await requireAdmin();
    return (
        <>
            <h2 className='h2-bold'>Create Product</h2>
            <div className='my-8'>
                <ProductForm type='Create'/>
            </div>
        </>
    );
};

export default CreateProductPage;