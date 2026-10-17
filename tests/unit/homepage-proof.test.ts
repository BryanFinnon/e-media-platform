import {describe,it,expect} from 'vitest';
import {brandSchema,reviewSchema} from '@/lib/domain/homepage-proof';
describe('homepage proof publishing',()=>{
 const review={name:'Test client',company:'',quote:'A test-only review fixture.',stars:5,published:true,permission:true};
 it('limits client ratings to actual 1–5 star values',()=>{expect(reviewSchema.safeParse({...review,stars:6}).success).toBe(false);expect(reviewSchema.safeParse({...review,stars:0}).success).toBe(false);expect(reviewSchema.safeParse(review).success).toBe(true);});
 it('requires approval for public reviews and logos',()=>{expect(reviewSchema.safeParse({...review,permission:false}).success).toBe(false);expect(brandSchema.safeParse({name:'Test brand',relationship:'Partner',published:true,permission:false}).success).toBe(false);});
 it('allows unpublished drafts without inventing a public endorsement',()=>{expect(reviewSchema.safeParse({...review,published:false,permission:false}).success).toBe(true);});
});
