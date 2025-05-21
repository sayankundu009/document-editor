import { lazy, Suspense } from 'react';
import Loading from './components/Loading';

const Editor = lazy(() => import('./Editor'));

export default (props) => {
    return (
        <Suspense fallback={props.loading || <Loading />}>
            <Editor {...props} />
        </Suspense>
    );
};