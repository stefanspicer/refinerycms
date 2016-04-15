class AddGravityToRefineryImages < ActiveRecord::Migration
  def change
    change_table :refinery_images do |t|
      t.string :gravity
    end
  end
end
