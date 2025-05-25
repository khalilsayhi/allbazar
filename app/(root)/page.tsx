import ProductList from "@/components/shared/product/product-list";
import {getFeaturedProducts, getLatestProducts} from "@/lib/actions/products.actions";
import {LATEST_PRODUCTS_LIMIT} from "@/lib/constants";
import ProductCarousel from "@/components/shared/product/product-carousel";
import ViewAllProductsButton from "@/components/view-all-products";
/* export const metadata = {
  title: "Home",
  description: "The best bazar in the world",
}; */

const Homepage = async () => {
    const latestProducts = await getLatestProducts();
    const featureProducts = await getFeaturedProducts();

    return (
        <>
            {featureProducts.length > 0 && (<ProductCarousel data={featureProducts}/>)}
            <ProductList
                data={latestProducts}
                title="newest Arrivals"
                limit={Number(LATEST_PRODUCTS_LIMIT)}
            />
            <ViewAllProductsButton/>
        </>
    );
};

export default Homepage;
