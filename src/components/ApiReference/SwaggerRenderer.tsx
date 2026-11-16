import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import {swaggerOptions} from './data';

const plugins = [() => ({components: {authorizeBtn: () => null}})];
export default function SwaggerRenderer({spec}: {spec: Record<string, unknown>}) {
 return <SwaggerUI {...swaggerOptions(spec)} plugins={plugins} />;
}
