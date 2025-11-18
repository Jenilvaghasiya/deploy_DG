export default function Table({ columns, data }) {
	return (
		<div className="overflow-x-auto rounded-xl custom-scroll">
			<table className="min-w-full text-sm text-left">
				<thead className="bg-[#3A3A3A] text-gray-300">
					<tr>
						{columns.map((col, idx) => (
							<th key={idx} className="p-2.5 lg:px-4 lg:py-3 uppercase text-sm xl:text-base font-semibold whitespace-nowrap">{col.header}</th>
						))}
					</tr>
				</thead>
				<tbody className="text-white">
					{data.map((row, rowIdx) => (
						<tr key={row.id || rowIdx} className={rowIdx % 2 === 0 ? "bg-[#161616]" : "bg-black"}>
							{columns.map((col, colIdx) => (
								<td key={colIdx} className="p-2.5 lg:px-4 lg:py-3">{col.render(row)}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
