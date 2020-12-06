import React, { useEffect, useState } from 'react'
import {
	TimestreamQueryContextConsumer,
	TimestreamQueryContextType,
} from './TimestreamQueryContext'
import { QueryCommand } from '@aws-sdk/client-timestream-query'
import { parseResult } from '@bifravst/timestream-helpers'
import { formatDistanceToNow } from 'date-fns'
import styled from 'styled-components'

const MeasureValue = styled.p`
	font-size: 500%;
	small {
		font-size: 50%;
	}
`

const Measures = styled.section`
	display: flex;
	flex-direction: row;
	justify-content: space-around;
	text-align: center;
`

const Measure = ({
	value,
	time,
	label,
}: {
	value: number
	time: Date
	label: string
}) => {
	const suffix = (value - Math.round(value)).toFixed(2).replace(/^0/, '')
	return (
		<div>
			<h2>{label}</h2>
			<MeasureValue>
				{value.toFixed(0)}
				{!/^\.00$/.test(suffix) && <small>{suffix}</small>}
			</MeasureValue>
			<p>
				<small>
					<time dateTime={time.toISOString()}>
						{formatDistanceToNow(time, { addSuffix: true })}
					</time>
				</small>
			</p>
		</div>
	)
}

const ShowTemp = ({
	timestreamQueryContext,
}: {
	timestreamQueryContext: TimestreamQueryContextType
}) => {
	const [readings, setReadings] = useState<
		{
			name: string
			value: number
			time: Date
		}[]
	>([
		{
			name: 'inside_rssi',
			value: -63,
			time: new Date('2020-12-06T21:20:08.097Z'),
		},
		{
			name: 'inside',
			value: 22.25,
			time: new Date('2020-12-06T21:20:08.097Z'),
		},
		{
			name: 'inside',
			value: 22,
			time: new Date('2020-12-06T19:05:08.637Z'),
		},
		{
			name: 'inside_rssi',
			value: -85,
			time: new Date('2020-12-06T19:05:08.637Z'),
		},
		{
			name: 'inside',
			value: 21.8700008392334,
			time: new Date('2020-12-06T19:00:08.801Z'),
		},
		{
			name: 'inside_rssi',
			value: -74,
			time: new Date('2020-12-06T19:00:08.801Z'),
		},
		{
			name: 'inside',
			value: 21.6200008392334,
			time: new Date('2020-12-06T17:15:08.620Z'),
		},
		{
			name: 'inside_rssi',
			value: -70,
			time: new Date('2020-12-06T17:15:08.620Z'),
		},
		{
			name: 'inside',
			value: 21.1200008392334,
			time: new Date('2020-12-06T13:05:09.185Z'),
		},
		{
			name: 'inside_rssi',
			value: -63,
			time: new Date('2020-12-06T13:05:09.185Z'),
		},
		{
			name: 'outside',
			value: 1.1200000047683716,
			time: new Date('2020-12-06T22:00:08.408Z'),
		},
		{
			name: 'outside_rssi',
			value: -83,
			time: new Date('2020-12-06T22:00:08.408Z'),
		},
		{
			name: 'outside',
			value: 1.25,
			time: new Date('2020-12-06T21:55:07.822Z'),
		},
		{
			name: 'outside_rssi',
			value: -81,
			time: new Date('2020-12-06T21:55:07.822Z'),
		},
		{
			name: 'outside',
			value: 1.3700000047683716,
			time: new Date('2020-12-06T21:45:08.218Z'),
		},
		{
			name: 'outside_rssi',
			value: -81,
			time: new Date('2020-12-06T21:45:08.218Z'),
		},
		{
			name: 'outside',
			value: 1.559999942779541,
			time: new Date('2020-12-06T21:40:08.137Z'),
		},
		{
			name: 'outside_rssi',
			value: -82,
			time: new Date('2020-12-06T21:40:08.137Z'),
		},
		{
			name: 'outside',
			value: 1.809999942779541,
			time: new Date('2020-12-06T21:35:08.264Z'),
		},
		{
			name: 'outside_rssi',
			value: -85,
			time: new Date('2020-12-06T21:35:08.264Z'),
		},
	])
	useEffect(() => {
		let isMounted = true
		return
		void Promise.all([
			timestreamQueryContext.client
				.send(
					new QueryCommand({
						QueryString: `SELECT measure_name as name, measure_value::double as value, time FROM "${timestreamQueryContext.db}"."${timestreamQueryContext.table}" WHERE measure_name IN ('inside', 'inside_rssi') ORDER BY time DESC LIMIT 10 `,
					}),
				)
				.then((res) =>
					parseResult<{
						name: string
						value: number
						time: Date
					}>(res as any),
				),
			timestreamQueryContext.client
				.send(
					new QueryCommand({
						QueryString: `SELECT measure_name as name, measure_value::double as value, time FROM "${timestreamQueryContext.db}"."${timestreamQueryContext.table}" WHERE measure_name IN ('outside', 'outside_rssi') ORDER BY time DESC LIMIT 10 `,
					}),
				)
				.then((res) =>
					parseResult<{
						name: string
						value: number
						time: Date
					}>(res as any),
				),
		]).then(([inside, outside]) => {
			if (isMounted) {
				setReadings([...inside, ...outside])
				console.log(
					JSON.stringify(
						{
							inside,
							outside,
						},
						null,
						2,
					),
				)
			}
		})
		return () => {
			isMounted = false
		}
	}, [timestreamQueryContext])
	const inside = readings.find(({ name }) => name === 'inside')
	const outside = readings.find(({ name }) => name === 'outside')
	const insideRssi = readings.find(({ name }) => name === 'inside_rssi')
	const outsideRssi = readings.find(({ name }) => name === 'outside_rssi')
	return (
		<>
			{(inside || outside) && (
				<Measures>
					{inside && (
						<Measure
							value={inside.value}
							time={inside.time}
							label="Inside °C"
						/>
					)}
					{outside && (
						<Measure
							value={outside.value}
							time={outside.time}
							label="Outside °C"
						/>
					)}
				</Measures>
			)}
			{(insideRssi || outsideRssi) && (
				<Measures>
					{insideRssi && (
						<Measure
							value={insideRssi.value}
							time={insideRssi.time}
							label="Inside RSSI"
						/>
					)}
					{outsideRssi && (
						<Measure
							value={outsideRssi.value}
							time={outsideRssi.time}
							label="Outside RSSI"
						/>
					)}
				</Measures>
			)}
		</>
	)
}

export const Temperature = () => (
	<TimestreamQueryContextConsumer>
		{(context) => (
			<>
				<ShowTemp timestreamQueryContext={context} />
			</>
		)}
	</TimestreamQueryContextConsumer>
)
