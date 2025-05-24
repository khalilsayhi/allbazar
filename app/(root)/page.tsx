import ProductList from "@/components/shared/product/product-list";
import {getLatestProducts} from "@/lib/actions/products.actions";
import {LATEST_PRODUCTS_LIMIT} from "@/lib/constants";
/* export const metadata = {
  title: "Home",
  description: "The best bazar in the world",
}; */

const Homepage = async () => {
    const latestProcucts = await getLatestProducts();
    return (
        <>
            <ProductList
                data={latestProcucts}
                title="newest Arrivals"
                limit={Number(LATEST_PRODUCTS_LIMIT)}
            />
        </>
    );
};

export default Homepage;
