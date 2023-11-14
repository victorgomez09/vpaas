import { OnlyId } from "../../../../types"

export interface ListDestinations {
    Querystring: {
        onlyVerified: string
    }
}
export interface CheckDestination {
    Body: {
        network: string
    }
}
export interface NewDestination extends OnlyId {
    Body: {
        name: string
        network: string
        engine: string
        isProxyUsed: boolean
    }
}
export interface SaveDestinationSettings extends OnlyId {
    Body: {
        engine: string
        isProxyUsed: boolean
    }
}
export interface Proxy extends OnlyId {

}