export function sortData(data, sortOption) {
    const sortedData = [...data]

    switch (sortOption) {
        case "name-asc":
            return sortedData.sort((a, b) => a.name.localeCompare(b.name))

        case "name-desc":
            return sortedData.sort((a, b) => b.name.localeCompare(a.name))

        case "created-date":
            return sortedData.sort((a, b) => {
                const dateA = new Date(a.created_at).getTime()
                const dateB = new Date(b.created_at).getTime()
                return dateB - dateA // Most recent first
            })

        case "updated-date":
            return sortedData.sort((a, b) => {
                const dateA = new Date(a.updated_at).getTime()
                const dateB = new Date(b.updated_at).getTime()
                return dateB - dateA // Most recent first
            })

        default:
            return sortedData
    }
}
