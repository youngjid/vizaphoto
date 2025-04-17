import photoStandards from './photo-standards.json'

export type DocumentType = {
  id: string
  name: string
  dimensions: {
    width: number
    height: number
    units: string
    dpi: number
    faceHeight: number
    bottomEyeLine: number
    crownTop: number
  }
  backgroundColor: string
  printable: boolean
  officialLinks: string[]
  comments: string[]
  thumbnail: string
}

export type Country = {
  code: string
  name: string
  flag: string
  passport: string
  documents: DocumentType[]
}

// Helper function to convert photo standard to document type
function convertToDocumentType(standard: any): DocumentType {
  return {
    id: standard.id,
    name: standard.text,
    dimensions: {
      width: standard.dimensions.pictureWidth,
      height: standard.dimensions.pictureHeight,
      units: standard.dimensions.units,
      dpi: standard.dimensions.dpi,
      faceHeight: standard.dimensions.faceHeight,
      bottomEyeLine: standard.dimensions.bottomEyeLine || standard.dimensions.faceHeight * 0.85, // Estimate if not provided
      crownTop: standard.dimensions.crownTop || standard.dimensions.faceHeight * 0.15 // Estimate if not provided
    },
    backgroundColor: standard.backgroundColor,
    printable: standard.printable,
    officialLinks: standard.officialLinks,
    comments: standard.comments ? [standard.comments] : [],
    thumbnail: standard.thumbnail
  }
}

// Group standards by country and convert to our format
const countryMap = photoStandards.reduce((acc: { [key: string]: any }, standard: any) => {
  const countryName = standard.country
  if (!acc[countryName]) {
    // Get country code from the thumbnail path
    const code = standard.thumbnail.split('/').pop()?.split('.')[0]?.toUpperCase() || ''
    acc[countryName] = {
      code,
      name: countryName,
      flag: `/assets/flags/${code.toLowerCase()}.svg`,
      passport: `/assets/passports/${code.toLowerCase()}.png`,
      documents: []
    }
  }
  acc[countryName].documents.push(convertToDocumentType(standard))
  return acc
}, {})

export const countries: Country[] = Object.values(countryMap)
