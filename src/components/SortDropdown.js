import { useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const SORT_OPTIONS = [
	{ value: 'latest', label: __( 'Latest added', 'snel' ) },
	{ value: 'alpha', label: __( 'A — Z', 'snel' ) },
	{ value: 'most', label: __( 'Most files', 'snel' ) },
];

export default function SortDropdown( { value, onChange } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const btnRef = useRef();

	return (
		<div className="relative">
			<button
				ref={ btnRef }
				onClick={ () => setIsOpen( ! isOpen ) }
				className="flex items-center justify-center w-[30px] h-[30px] rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer border-none bg-transparent transition-colors"
				title={ __( 'Sort folders', 'snel' ) }
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>
				</svg>
			</button>

			{ isOpen && (
				<>
					<div
						className="fixed inset-0 z-[9998]"
						onClick={ () => setIsOpen( false ) }
					/>
					<div className="absolute right-0 top-full mt-1 z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
						{ SORT_OPTIONS.map( ( opt ) => (
							<button
								key={ opt.value }
								onClick={ () => { onChange( opt.value ); setIsOpen( false ); } }
								className={ `flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left border-none cursor-pointer transition-colors ${
									value === opt.value
										? 'bg-blue-50 text-blue-600 font-medium'
										: 'bg-transparent text-gray-600 hover:bg-gray-50'
								}` }
							>
								{ value === opt.value && (
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
										<path d="M20 6 9 17l-5-5"/>
									</svg>
								) }
								{ value !== opt.value && <span className="w-3" /> }
								{ opt.label }
							</button>
						) ) }
					</div>
				</>
			) }
		</div>
	);
}
