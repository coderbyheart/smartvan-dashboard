import React from 'react'
import { TimestreamQueryClient } from '@aws-sdk/client-timestream-query'

export type TimestreamQueryContextType = {
	client: TimestreamQueryClient
	db: string
	table: string
}

export const TimestreamQueryContext = React.createContext<TimestreamQueryContextType>(
	{
		client: new TimestreamQueryClient({ region: 'us-east-1' }),
		db: '',
		table: '',
	},
)
export const TimestreamQueryContextConsumer = TimestreamQueryContext.Consumer
