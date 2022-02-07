export interface Product {
  linkText: string
  productName: string
  brand: string
  categoryId: string
  categoryTree: Category[]
  productId: string
  titleTag: string
  metaTagDescription: string
  items: SKU[]
  skuSpecifications: SkuSpecification[]
}

export interface Category {
  id: string
  name: string
}

export interface SKU {
  itemId: string
  ean: string
  referenceId: [{ Value: string }]
  sellers: Seller[]
}

interface Seller {
  commertialOffer: CommertialOffer
}

interface CommertialOffer {
  ListPrice: number
  Price: number
}

interface Seller {
  commertialOffer: CommertialOffer
}

interface CommertialOffer {
  AvailableQuantity: number
}

interface SkuSpecification {
  field: SkuSpecificationField
  values: SkuSpecificationValues[]
}

interface SkuSpecificationField {
  name: string
}

interface SkuSpecificationValues {
  name: string
}

interface ProductItem {
  itemId: string
  name: string
  images: Image[]
  variations: Array<{
    name: string
    values: string[]
  }>
  sellers: Array<{
    sellerDefault: boolean
    commertialOffer: {
      Price: number
      ListPrice: number
      AvailableQuantity: number
    }
  }>
}

interface Product {
  brand: string
  brandId: string
  itemMetadata: ItemMetadata
  items: ProductItem[]
  linkText: string
  productId: string
  skuSpecifications: SkuSpecification[]
  productName: string
  productReference: string
  brand: string
  description: string
}

export interface SkuSpecification {
  field: SkuSpecificationField
  values: SkuSpecificationValues[]
}

interface SkuSpecificationField {
  name: string
  originalName: string
}

interface SkuSpecificationValues {
  name: string
  originalName: string
}

export interface Seller {
  sellerDefault: boolean
  commertialOffer: {
    Price: number
    AvailableQuantity: number
  }
}

type GroupId = string

interface AssemblyOptionItem {
  id: string
  quantity: number
  seller: string
  initialQuantity: number
  choiceType: string
  name: string
  price: number
  children: Record<string, AssemblyOptionItem[]> | null
}

type InputValues = Record<string, string>

export interface ProductContext {
  product?: Product
  selectedItem: ProductItem | null
  selectedQuantity: number
  skuSelector: {
    isVisible: boolean
    areAllVariationsSelected: boolean
    selectedImageVariationSKU: string
  }
  buyButton: {
    clicked: boolean
  }
  assemblyOptions: {
    items: Record<GroupId, AssemblyOptionItem[]>
    inputValues: Record<GroupId, InputValues>
    areGroupsValid: Record<GroupId, boolean>
  }
}
