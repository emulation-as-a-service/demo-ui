import { Directive, ElementRef, Injector, Input, Output, EventEmitter } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';

/**
 * Wrapper for descriptionText javascript component
 */
@Directive({
    selector: 'description-text'
})
export class DescriptionTextDirective extends UpgradeComponent {
    @Input() description: string;
    @Input() disabled: boolean;
    @Output() updateDescription!: EventEmitter<any>;

    constructor(elementRef: ElementRef, injector: Injector) {
        super('descriptionText', elementRef, injector);
    }
}
