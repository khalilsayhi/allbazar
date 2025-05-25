'use client';


import {Product} from "@/types";
import {ControllerRenderProps, SubmitHandler, useForm} from "react-hook-form";
import {z} from "zod";
import {insertProductSchema, updateProductSchema} from "@/lib/validators";
import {zodResolver} from "@hookform/resolvers/zod";
import {productDefaultValues} from "@/lib/constants";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import slugify from "slugify";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {createProduct, updateProduct} from "@/lib/actions/products.actions";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {Card, CardContent} from "@/components/ui/card";
import Image from "next/image";
import {UploadButton} from "@/lib/uploadthing";
import {Checkbox} from "@/components/ui/checkbox";

const ProductForm = ({type, product, productId}: {
    type: "Create" | "Update";
    product?: Product;
    productId?: string
}) => {
    const router = useRouter();
    const form = useForm<z.infer<typeof insertProductSchema>>(
        {
            resolver: type === "Update" ? zodResolver(updateProductSchema) : zodResolver(insertProductSchema),
            defaultValues: type === "Update" ? product : productDefaultValues
        }
    )

    const onSubmit: SubmitHandler<z.infer<typeof insertProductSchema>> = async (values) => {
        if (type === "Create") {
            const res = await createProduct(values);
            form.reset();
            if (!res.success) {
                toast.error(res.message);
            } else {
                toast.success(res.message);
            }
            router.push('/admin/products');
        }
        if (type === "Update") {
            if (!productId) {
                router.push("/admin/products")
                return
            }
            const res = await updateProduct({...values, id: productId});
            form.reset();
            if (!res.success) {
                toast.error(res.message);
            } else {
                toast.success(res.message);
            }
            router.push('/admin/products');
        }
    }
    const images = form.watch('images')
    const isFeatured = form.watch('isFeatured')
    const banner = form.watch('banner')
    return (
        <Form {...form}>
            <form method="POST" onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                <div className="flex flex-col gap-10 md:flex-row">
                    <FormField
                        control={form.control}
                        name='name'
                        render={({
                                     field,
                                 }: {
                            field: ControllerRenderProps<
                                z.infer<typeof insertProductSchema>,
                                'name'
                            >;
                        }) => (
                            <FormItem className='w-full'>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder='Enter product name' {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    {/* Slug */}
                    <FormField
                        control={form.control}
                        name='slug'
                        render={({
                                     field,
                                 }: {
                            field: ControllerRenderProps<
                                z.infer<typeof insertProductSchema>,
                                'slug'
                            >;
                        }) => (
                            <FormItem className='w-full'>
                                <FormLabel>Slug</FormLabel>
                                <FormControl>
                                    <div className='relative'>
                                        <Input placeholder='Enter slug' {...field} />
                                        <Button
                                            type='button'
                                            className='bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 mt-2 absolute'
                                            onClick={() => {
                                                form.setValue(
                                                    'slug',
                                                    slugify(form.getValues('name'), {lower: true})
                                                );
                                            }}
                                        >
                                            Generate
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex flex-col gap-10 mt-3 md:flex-row">
                    <FormField
                        control={form.control}
                        name='category'
                        render={({
                                     field,
                                 }: {
                            field: ControllerRenderProps<
                                z.infer<typeof insertProductSchema>,
                                'category'
                            >;
                        }) => (
                            <FormItem className='w-full'>
                                <FormLabel>Category</FormLabel>
                                <FormControl>
                                    <Input placeholder='Enter product category' {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='brand'
                        render={({
                                     field,
                                 }: {
                            field: ControllerRenderProps<
                                z.infer<typeof insertProductSchema>,
                                'brand'
                            >;
                        }) => (
                            <FormItem className='w-full'>
                                <FormLabel>Brand</FormLabel>
                                <FormControl>
                                    <Input placeholder='Enter product Brand' {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex flex-col gap-10 md:flex-row">
                    <FormField
                        control={form.control}
                        name='price'
                        render={({
                                     field,
                                 }: {
                            field: ControllerRenderProps<
                                z.infer<typeof insertProductSchema>,
                                'price'
                            >;
                        }) => (
                            <FormItem className='w-full'>
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                    <Input placeholder='Enter product price' {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    /> <FormField
                    control={form.control}
                    name='stock'
                    render={({
                                 field,
                             }: {
                        field: ControllerRenderProps<
                            z.infer<typeof insertProductSchema>,
                            'stock'
                        >;
                    }) => (
                        <FormItem className='w-full'>
                            <FormLabel>Stock</FormLabel>
                            <FormControl>
                                <Input placeholder='Enter product stock' {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                </div>
                <div className="upload-field flex flex-col gap-5 md:flex-row">
                    <FormField
                        control={form.control}
                        name='images'
                        render={() => (
                            <FormItem className='w-full'>
                                <FormLabel>Name</FormLabel>
                                <Card>
                                    <CardContent className="space-y-2 mt-2 min-h-48">
                                        <div className="flex-start space-x-2">
                                            {images.map(image => (
                                                <Image key={image} src={image} alt="product image"
                                                       className="w-20 h-20 object-covers object-center rounded-sm"
                                                       width={100} height={100}/>
                                            ))}
                                            <FormControl>
                                                <UploadButton endpoint="imageUploader"
                                                              onClientUploadComplete={(res: { url: string }[]) => {
                                                                  form.setValue("images", [...images, res[0].url]);
                                                              }}
                                                              onUploadError={(e: Error) => {
                                                                  toast.error(e.message)
                                                              }}
                                                />
                                            </FormControl>
                                        </div>
                                    </CardContent>
                                </Card>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="upload-field">
                    Featured Product
                    <Card>
                        <CardContent className="space-y-2 mt-2">
                            <FormField control={form.control} name="isFeatured" render={({field}) => (
                                <FormItem className="space-x-2 items-center">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                                    </FormControl>
                                    <FormLabel>Is featured?</FormLabel>
                                </FormItem>
                            )}/>
                            {isFeatured && banner && (
                                <Image
                                    src={banner}
                                    alt='banner image'
                                    className='w-full object-cover object-center rounded-sm'
                                    width={1920}
                                    height={680}
                                />
                            )}
                            {isFeatured && !banner && (
                                <UploadButton
                                    endpoint='imageUploader'
                                    onClientUploadComplete={(res: { url: string }[]) => {
                                        form.setValue('banner', res[0].url);
                                    }}
                                    onUploadError={(error: Error) => {
                                        toast.error(`ERROR! ${error.message}`);
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <FormField
                        control={form.control}
                        name='description'
                        render={({
                                     field,
                                 }: {
                            field: ControllerRenderProps<
                                z.infer<typeof insertProductSchema>,
                                'description'
                            >;
                        }) => (
                            <FormItem className='w-full'>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea className="resize-none"
                                              placeholder='Enter product description' {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <div>
                    <Button type="submit" size="lg" disabled={form.formState.isSubmitting}
                            className="button col-span-2 w-full">
                        {form.formState.isSubmitting ? "Submitting..." : `${type} Product`}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default ProductForm;