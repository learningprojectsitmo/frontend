import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import { Link } from 'react-router';
import type { Dispatch, SetStateAction } from 'react'

type Props = {
    page: number,
    setPage: Dispatch<SetStateAction<number>>,
    pageName: string
}

export function PaginationBlock({page, setPage, pageName} : Props) {

  return (
    <div className="pagination-block">
        <Pagination 
            count={10}// общее число страниц, пока что 10, так как нету пока соответствующего эндпоинта в api
            page={page}
            onChange={(_, num) => setPage(num)}
            renderItem={(item) => (
            <PaginationItem
                component={Link}
                to={`/${pageName}?page=${item.page}`}
                {...item}
            /> //перебирает каждый "цифру" в строке пагинации и ставит к каждой ссылку с URL параметрами
            )}
        />
    </div>
  );
}