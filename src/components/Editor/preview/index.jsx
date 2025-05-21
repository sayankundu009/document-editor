import { lazy, Suspense } from 'react';
import Loading from '../components/Loading';

const PreviewEditor = lazy(() => import('./Preview'));

export default (props) => {
    return (
        <Suspense fallback={props.loading || <Loading />}>
            <PreviewEditor {...props} />
        </Suspense>
    );
};