import { cn } from "@/lib/utils";

const ProductPrice = ({
  value,
  className,
}: {
  value: string;
  className?: string;
}) => {
  /*   const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };
 */
  // ensure decimal values are rounded to 2 decimal places
  /*   const stringValue = value.toFixed(2); */
  // get int and float
  const [intValue, floatValue] = value.split(".");
  return (
    <span className={cn("text-2xl", className)}>
      <span className="text-xs align-super">$</span>
      {intValue}
      <span className="text-xs align-super">.{floatValue}</span>
    </span>
  );
};

export default ProductPrice;
