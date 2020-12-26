import React, { useEffect, useRef, useState } from 'react'
import { Chart } from 'chart.js'
import styled from 'styled-components'
import { format } from 'date-fns'
import {
	TimestreamQueryContextConsumer,
	TimestreamQueryContextType,
} from './TimestreamQueryContext'
import { QueryCommand } from '@aws-sdk/client-timestream-query'
import { parseResult } from '@bifravst/timestream-helpers'

const Canvas = styled.canvas`
	width: 100%;
`

// Colors: https://colorswall.com/palette/326/

type Reading = { inside: number; outside: number; time: Date }

const TemperatureChart = ({
	readings,
	sections,
}: {
	readings: Reading[]
	sections: 'days' | 'hours'
}) => {
	const ref = useRef<HTMLCanvasElement>(null)
	const [chartInstance, setChartInstance] = useState<Chart>()

	const data = {
		labels: readings.map(({ time }) =>
			format(time, sections === 'days' ? 'EEEEEE d.LL. H:00' : 'H:00'),
		),
		datasets: [
			{
				label: 'Inside',
				backgroundColor: '#28b4c8',
				borderColor: '#186A77',
				fill: false,
				data: readings.map(({ inside }) => Math.round(inside * 10) / 10),
				spanGaps: true,
			},
			{
				label: 'Outside',
				backgroundColor: '#78D237',
				borderColor: '#40741A',
				fill: false,
				data: readings.map(({ outside }) => Math.round(outside * 10) / 10),
				spanGaps: true,
			},
		],
	}

	useEffect(() => {
		let chart: Chart
		if (ref?.current !== null) {
			setChartInstance(
				(chart = new Chart(ref.current, {
					type: 'line',
					options: {
						responsive: true,
						scales: {
							xAxes: [
								{
									display: true,
									scaleLabel: {
										display: true,
										labelString: 'Hour',
									},
								},
							],
							yAxes: [
								{
									display: true,
									scaleLabel: {
										display: true,
										labelString: 'Temperature',
									},
								},
							],
						},
					},
				})),
			)
		}
		return () => {
			console.log(`Destroying`)
			chart?.destroy()
		}
	}, [ref])

	if (chartInstance) {
		chartInstance.data = data
		chartInstance.update()
	}

	return <Canvas ref={ref} width="400" height="250" />
}

enum Duration {
	ONE_WEEK = '7d',
	ONE_DAY = '1d',
}

const LoadTemperatureHistory = ({
	timestreamQueryContext,
}: {
	timestreamQueryContext: TimestreamQueryContextType
}) => {
	const [readings, setReadings] = useState<{
		data: Reading[]
		resolution: Duration
	}>()
	const [history, setHistory] = useState<Duration>(Duration.ONE_DAY)

	useEffect(() => {
		let isMounted = true
		void timestreamQueryContext.client
			.send(
				new QueryCommand({
					QueryString: `
                        SELECT AVG(
                            CASE WHEN measure_name = 'inside' THEN measure_value::double ELSE NULL END
                        ) AS inside,
                        AVG(
                            CASE WHEN measure_name = 'outside' THEN measure_value::double ELSE NULL END
                        ) AS outside, bin(time, 1h) as time 
                        FROM "${timestreamQueryContext.db}"."${timestreamQueryContext.table}" 
                        WHERE measure_name IN ('inside', 'outside') AND time > ago(${history}) GROUP BY bin(time, 1h) ORDER BY bin(time, 1h) ASC`,
				}),
			)
			.then((res) => parseResult<Reading>(res as any))
			.then((readings) => {
				if (isMounted) {
					setReadings({ data: readings, resolution: history })
				}
			})
		return () => {
			isMounted = false
		}
	}, [timestreamQueryContext, history])

	return (
		<div>
			{readings && (
				<TemperatureChart
					readings={readings.data}
					sections={
						readings.resolution === Duration.ONE_WEEK ? 'days' : 'hours'
					}
				/>
			)}
			<form>
				<div className="form-check form-check-inline">
					<input
						className="form-check-input"
						type="radio"
						name="history"
						id="week"
						value={Duration.ONE_WEEK}
						checked={history === Duration.ONE_WEEK}
						onChange={() => setHistory(Duration.ONE_WEEK)}
					/>
					<label className="form-check-label" htmlFor="week">
						1 week
					</label>
				</div>
				<div className="form-check form-check-inline">
					<input
						className="form-check-input"
						type="radio"
						name="history"
						id="day"
						value={Duration.ONE_DAY}
						checked={history === Duration.ONE_DAY}
						onChange={() => setHistory(Duration.ONE_DAY)}
					/>
					<label className="form-check-label" htmlFor="day">
						24 hours
					</label>
				</div>
			</form>
		</div>
	)
}

export const TemperatureHistory = () => (
	<TimestreamQueryContextConsumer>
		{(context) => <LoadTemperatureHistory timestreamQueryContext={context} />}
	</TimestreamQueryContextConsumer>
)
